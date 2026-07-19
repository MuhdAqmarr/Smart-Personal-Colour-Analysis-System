"""Integration tests for the admin portal endpoints."""

from __future__ import annotations

import httpx
import pytest

from tests import fixtures
from tests.integration.conftest import UserFactory

pytestmark = pytest.mark.integration


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


class TestAuthorisation:
    @pytest.mark.parametrize(
        "path",
        [
            "/api/v1/admin/stats",
            "/api/v1/admin/audit-logs",
            "/api/v1/admin/algorithm-versions",
            "/api/v1/admin/settings",
            "/api/v1/admin/stores",
            "/api/v1/admin/products",
        ],
    )
    async def test_normal_user_gets_403(
        self, app_client: httpx.AsyncClient, users: UserFactory, path: str
    ) -> None:
        _, token = await users.create()
        response = await app_client.get(path, headers=auth(token))
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"

    async def test_anonymous_gets_401(self, app_client: httpx.AsyncClient) -> None:
        response = await app_client.get("/api/v1/admin/stats")
        assert response.status_code == 401


class TestStats:
    async def test_stats_are_anonymised_aggregates(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, admin_token = await users.create(role="admin")
        _, user_token = await users.create()
        await app_client.post(
            "/api/v1/analyses",
            files={"image": ("face.jpg", fixtures.valid_face_bytes(), "image/jpeg")},
            headers=auth(user_token),
        )

        response = await app_client.get("/api/v1/admin/stats", headers=auth(admin_token))
        assert response.status_code == 200
        body = response.json()
        assert body["totalAnalyses"] >= 1
        assert body["classifierVersion"] == "1.0.0"
        assert isinstance(body["seasonDistribution"], dict)
        # Nothing user-identifiable in the payload.
        blob = str(body).lower()
        assert "email" not in blob
        assert "@test.local" not in blob


class TestSettings:
    async def test_update_setting_and_audit(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn
    ) -> None:
        _, admin_token = await users.create(role="admin")
        response = await app_client.put(
            "/api/v1/admin/settings/products.max_recommendations",
            headers=auth(admin_token),
            json={"value": 18},
        )
        assert response.status_code == 200
        assert response.json()["value"] == 18

        audits = await db_conn.fetchval(
            "select count(*) from public.admin_audit_logs where action = 'settings.update'"
        )
        assert audits >= 1

        # Restore the seeded value.
        await app_client.put(
            "/api/v1/admin/settings/products.max_recommendations",
            headers=auth(admin_token),
            json={"value": 24},
        )

    async def test_unknown_setting_404(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, admin_token = await users.create(role="admin")
        response = await app_client.put(
            "/api/v1/admin/settings/not.a.real.key",
            headers=auth(admin_token),
            json={"value": 1},
        )
        assert response.status_code == 404


class TestStoreCrud:
    async def test_create_update_deactivate_store(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn
    ) -> None:
        _, admin_token = await users.create(role="admin")
        created = await app_client.post(
            "/api/v1/admin/stores",
            headers=auth(admin_token),
            json={"slug": "it-test-store", "name": "IT Test Store"},
        )
        assert created.status_code == 201
        store = created.json()

        updated = await app_client.patch(
            f"/api/v1/admin/stores/{store['id']}",
            headers=auth(admin_token),
            json={"name": "Renamed Store", "isActive": False},
        )
        assert updated.status_code == 200
        assert updated.json()["name"] == "Renamed Store"
        assert updated.json()["isActive"] is False

        # Inactive stores disappear from the public directory queries.
        public = await app_client.get("/api/v1/products?store=it-test-store")
        assert public.json()["pagination"]["totalItems"] == 0

        await db_conn.execute("delete from public.stores where slug = 'it-test-store'")

    async def test_duplicate_slug_rejected(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, admin_token = await users.create(role="admin")
        response = await app_client.post(
            "/api/v1/admin/stores",
            headers=auth(admin_token),
            json={"slug": "coloursense-demo-boutique", "name": "Duplicate"},
        )
        assert response.status_code == 400


class TestProductAdmin:
    async def test_create_and_deactivate_product(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn
    ) -> None:
        _, admin_token = await users.create(role="admin")
        created = await app_client.post(
            "/api/v1/admin/products",
            headers=auth(admin_token),
            json={
                "storeSlug": "coloursense-demo-boutique",
                "name": "Admin Created Cardigan",
                "category": "tops",
                "gender": "women",
                "productUrl": "https://example.com/admin/cardigan",
                "price": 88.0,
                "colourName": "Moss",
                "colourHex": "#8a9a5b",
                "seasonTags": ["autumn"],
            },
        )
        assert created.status_code == 201
        product_id = created.json()["id"]

        # Visible publicly while active…
        public = await app_client.get("/api/v1/products?q=Admin Created Cardigan")
        assert public.json()["pagination"]["totalItems"] == 1

        # …hidden once deactivated.
        toggled = await app_client.patch(
            f"/api/v1/admin/products/{product_id}",
            headers=auth(admin_token),
            json={"isActive": False},
        )
        assert toggled.status_code == 200
        public_after = await app_client.get("/api/v1/products?q=Admin Created Cardigan")
        assert public_after.json()["pagination"]["totalItems"] == 0

        await db_conn.execute(
            "delete from public.products where id = $1", __import__("uuid").UUID(product_id)
        )

    async def test_invalid_product_url_rejected(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, admin_token = await users.create(role="admin")
        response = await app_client.post(
            "/api/v1/admin/products",
            headers=auth(admin_token),
            json={
                "storeSlug": "coloursense-demo-boutique",
                "name": "Bad URL Product",
                "category": "tops",
                "productUrl": "javascript:alert(1)",
                "colourHex": "#8a9a5b",
            },
        )
        assert response.status_code == 400


class TestPaletteAdmin:
    async def test_palette_colour_lifecycle(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, admin_token = await users.create(role="admin")
        created = await app_client.post(
            "/api/v1/admin/palette-colours",
            headers=auth(admin_token),
            json={
                "seasonSlug": "spring",
                "name": "IT Test Colour",
                "hex": "#ffaa88",
                "paletteGroup": "accents",
                "recommendedUse": "Testing only.",
            },
        )
        assert created.status_code == 201
        colour_id = created.json()["id"]

        # Publicly visible in the spring palette.
        season = await app_client.get("/api/v1/seasons/spring")
        names = [c["name"] for c in season.json()["groups"]["accents"]]
        assert "IT Test Colour" in names

        updated = await app_client.patch(
            f"/api/v1/admin/palette-colours/{colour_id}",
            headers=auth(admin_token),
            json={"isActive": False},
        )
        assert updated.status_code == 200
        season_after = await app_client.get("/api/v1/seasons/spring")
        names_after = [c["name"] for c in season_after.json()["groups"].get("accents", [])]
        assert "IT Test Colour" not in names_after

        deleted = await app_client.delete(
            f"/api/v1/admin/palette-colours/{colour_id}", headers=auth(admin_token)
        )
        assert deleted.status_code == 204

    async def test_cosmetic_lifecycle(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, admin_token = await users.create(role="admin")
        created = await app_client.post(
            "/api/v1/admin/cosmetics",
            headers=auth(admin_token),
            json={
                "seasonSlug": "winter",
                "productType": "lipstick",
                "name": "IT Test Lipstick",
                "hex": "#aa1133",
            },
        )
        assert created.status_code == 201
        cosmetic_id = created.json()["id"]

        deleted = await app_client.delete(
            f"/api/v1/admin/cosmetics/{cosmetic_id}", headers=auth(admin_token)
        )
        assert deleted.status_code == 204


class TestAuditLog:
    async def test_audit_entries_visible_to_admin(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, admin_token = await users.create(role="admin")
        await app_client.put(
            "/api/v1/admin/settings/app.product_name",
            headers=auth(admin_token),
            json={"value": "ColourSense"},
        )
        logs = await app_client.get("/api/v1/admin/audit-logs", headers=auth(admin_token))
        assert logs.status_code == 200
        assert any(entry["action"] == "settings.update" for entry in logs.json())
