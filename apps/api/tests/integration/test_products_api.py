"""Integration tests: product directory, recommendations, favourites, imports."""

from __future__ import annotations

from pathlib import Path

import httpx
import pytest

from tests import fixtures
from tests.integration.conftest import UserFactory

pytestmark = pytest.mark.integration

SAMPLE_CSV = Path(__file__).resolve().parents[4] / "scripts" / "sample-products.csv"


class TestDirectory:
    async def test_public_listing_with_pagination(self, app_client: httpx.AsyncClient) -> None:
        response = await app_client.get("/api/v1/products?page_size=10")
        assert response.status_code == 200
        body = response.json()
        assert body["pagination"]["totalItems"] >= 30  # seeded demo products
        assert len(body["items"]) == 10
        first = body["items"][0]
        assert first["productUrl"].startswith("https://")
        assert first["isDemo"] is True
        assert first["colours"][0]["hex"].startswith("#")

    async def test_category_and_season_filters(self, app_client: httpx.AsyncClient) -> None:
        response = await app_client.get("/api/v1/products?category=hijabs&season=autumn")
        assert response.status_code == 200
        items = response.json()["items"]
        assert items, "expected at least one autumn hijab in the seed"
        for item in items:
            assert item["category"] == "hijabs"
            assert any(tag["seasonSlug"] == "autumn" for tag in item["seasonTags"])

    async def test_search_filter(self, app_client: httpx.AsyncClient) -> None:
        response = await app_client.get("/api/v1/products?q=terracotta")
        assert response.status_code == 200
        assert any("Terracotta" in item["name"] for item in response.json()["items"])

    async def test_invalid_category_rejected(self, app_client: httpx.AsyncClient) -> None:
        response = await app_client.get("/api/v1/products?category=spaceships")
        assert response.status_code == 400

    async def test_price_sorting(self, app_client: httpx.AsyncClient) -> None:
        response = await app_client.get("/api/v1/products?sort=price_asc&page_size=48")
        prices = [item["price"] for item in response.json()["items"] if item["price"] is not None]
        assert prices == sorted(prices)

    async def test_product_detail(self, app_client: httpx.AsyncClient) -> None:
        listing = await app_client.get("/api/v1/products?page_size=1")
        product_id = listing.json()["items"][0]["id"]
        response = await app_client.get(f"/api/v1/products/{product_id}")
        assert response.status_code == 200
        assert response.json()["id"] == product_id


class TestRecommendations:
    async def test_recommended_products_for_analysis(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token = await users.create()
        created = await app_client.post(
            "/api/v1/analyses",
            files={"image": ("face.jpg", fixtures.valid_face_bytes(), "image/jpeg")},
            headers={"Authorization": f"Bearer {token}"},
        )
        analysis = created.json()
        season = analysis["season"]["season"]

        response = await app_client.get(
            f"/api/v1/analyses/{analysis['analysisId']}/recommended-products",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        items = response.json()
        assert items, "expected recommendations from the seeded catalogue"
        scores = [item["matchScore"] for item in items]
        assert scores == sorted(scores, reverse=True)
        assert all(0.0 <= score <= 1.0 for score in scores)
        # The top recommendations should lean toward the analysed season.
        top_half = items[: max(1, len(items) // 2)]
        assert any(
            any(tag["seasonSlug"] == season for tag in item["seasonTags"]) for item in top_half
        )

    async def test_recommendations_require_ownership(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token_a = await users.create()
        _, token_b = await users.create()
        created = await app_client.post(
            "/api/v1/analyses",
            files={"image": ("face.jpg", fixtures.valid_face_bytes(), "image/jpeg")},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        response = await app_client.get(
            f"/api/v1/analyses/{created.json()['analysisId']}/recommended-products",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert response.status_code == 404


class TestFavourites:
    async def test_favourite_roundtrip_and_privacy(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token_a = await users.create()
        _, token_b = await users.create()
        listing = await app_client.get("/api/v1/products?page_size=1")
        product_id = listing.json()["items"][0]["id"]

        added = await app_client.post(
            f"/api/v1/products/{product_id}/favourite",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert added.status_code == 204

        mine = await app_client.get(
            "/api/v1/me/favourite-products", headers={"Authorization": f"Bearer {token_a}"}
        )
        assert [item["id"] for item in mine.json()] == [product_id]
        assert mine.json()[0]["isFavourite"] is True

        theirs = await app_client.get(
            "/api/v1/me/favourite-products", headers={"Authorization": f"Bearer {token_b}"}
        )
        assert theirs.json() == []

        removed = await app_client.delete(
            f"/api/v1/products/{product_id}/favourite",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert removed.status_code == 204

    async def test_favourite_requires_auth(self, app_client: httpx.AsyncClient) -> None:
        listing = await app_client.get("/api/v1/products?page_size=1")
        product_id = listing.json()["items"][0]["id"]
        response = await app_client.post(f"/api/v1/products/{product_id}/favourite")
        assert response.status_code == 401


class TestCsvImport:
    async def test_non_admin_cannot_import(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token = await users.create()
        response = await app_client.post(
            "/api/v1/admin/products/import?dry_run=true",
            files={"file": ("products.csv", SAMPLE_CSV.read_bytes(), "text/csv")},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    async def test_dry_run_previews_without_inserting(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn
    ) -> None:
        _, token = await users.create(role="admin")
        before = await db_conn.fetchval("select count(*) from public.products")
        response = await app_client.post(
            "/api/v1/admin/products/import?dry_run=true",
            files={"file": ("products.csv", SAMPLE_CSV.read_bytes(), "text/csv")},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["dryRun"] is True
        assert body["totalRows"] == 3
        assert body["validRows"] == 3
        assert body["insertedRows"] == 0
        after = await db_conn.fetchval("select count(*) from public.products")
        assert after == before

    async def test_commit_inserts_products_and_records_job(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn
    ) -> None:
        _, token = await users.create(role="admin")
        response = await app_client.post(
            "/api/v1/admin/products/import?dry_run=false",
            files={"file": ("products.csv", SAMPLE_CSV.read_bytes(), "text/csv")},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["insertedRows"] + body["updatedRows"] == 3

        imported = await db_conn.fetchrow(
            "select * from public.products where product_url = $1",
            "https://example.com/import/terracotta-blouse",
        )
        assert imported is not None
        assert imported["is_demo"] is False

        jobs = await app_client.get(
            "/api/v1/admin/products/imports", headers={"Authorization": f"Bearer {token}"}
        )
        assert jobs.status_code == 200
        assert any(job["id"] == body["jobId"] for job in jobs.json())

        # Audit trail exists for the import.
        audit_count = await db_conn.fetchval(
            "select count(*) from public.admin_audit_logs where entity_id = $1", body["jobId"]
        )
        assert audit_count == 1

        # Cleanup imported rows to keep other tests stable.
        await db_conn.execute(
            "delete from public.products where product_url like 'https://example.com/import/%'"
        )

    async def test_broken_rows_reported_with_row_numbers(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token = await users.create(role="admin")
        broken = (
            SAMPLE_CSV.read_bytes()
            + b"\nBroken,,x,badcat,women,,,notaurl,,,MYR,in_stock,,#zz,autumn,,true"
        )
        response = await app_client.post(
            "/api/v1/admin/products/import?dry_run=true",
            files={"file": ("broken.csv", broken, "text/csv")},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["errorRows"] >= 1
        assert body["errors"][0]["rowNumber"] == 5
