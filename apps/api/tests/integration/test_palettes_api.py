"""Integration tests for the palette catalogue and favourite colours."""

from __future__ import annotations

import httpx
import pytest

from tests import fixtures
from tests.integration.conftest import UserFactory

pytestmark = pytest.mark.integration


class TestCatalogue:
    async def test_lists_four_seasons_with_subseasons(
        self, app_client: httpx.AsyncClient
    ) -> None:
        response = await app_client.get("/api/v1/seasons")
        assert response.status_code == 200
        body = response.json()
        assert [season["slug"] for season in body] == ["spring", "summer", "autumn", "winter"]
        for season in body:
            assert len(season["subSeasons"]) == 3
            assert season["characteristics"]["temperature"] in ("warm", "cool")

    async def test_season_detail_groups_and_cosmetics(
        self, app_client: httpx.AsyncClient
    ) -> None:
        response = await app_client.get("/api/v1/seasons/autumn")
        assert response.status_code == 200
        body = response.json()
        assert body["slug"] == "autumn"
        groups = body["groups"]
        for expected in (
            "neutrals",
            "core",
            "accents",
            "formal",
            "casual",
            "accessories",
            "headwear",
            "cautious",
        ):
            assert groups.get(expected), f"missing group {expected}"
        # Cautious wording is gentle, never absolute.
        cautious_text = " ".join(c["recommendedUse"] for c in groups["cautious"]).lower()
        assert "forbidden" not in cautious_text
        assert len(body["cosmetics"]) >= 10
        types = {c["productType"] for c in body["cosmetics"]}
        assert {"lipstick", "blusher", "eyeshadow", "eyeliner", "highlighter", "foundation"} <= types

    async def test_subseason_signature_colours_merged(
        self, app_client: httpx.AsyncClient
    ) -> None:
        plain = await app_client.get("/api/v1/seasons/winter")
        with_sub = await app_client.get("/api/v1/seasons/winter?subseason=deep-winter")
        plain_core = {c["name"] for c in plain.json()["groups"]["core"]}
        sub_core = {c["name"] for c in with_sub.json()["groups"]["core"]}
        assert "Black Cherry" in sub_core  # deep-winter signature
        assert "Black Cherry" not in plain_core
        assert with_sub.json()["appliedSubseason"] == "deep-winter"

    async def test_unknown_season_404(self, app_client: httpx.AsyncClient) -> None:
        response = await app_client.get("/api/v1/seasons/rainbow")
        assert response.status_code == 404


class TestAnalysisPalette:
    async def test_palette_for_owned_analysis(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token = await users.create()
        created = await app_client.post(
            "/api/v1/analyses",
            files={"image": ("face.jpg", fixtures.valid_face_bytes(), "image/jpeg")},
            headers={"Authorization": f"Bearer {token}"},
        )
        analysis = created.json()
        response = await app_client.get(
            f"/api/v1/analyses/{analysis['analysisId']}/palette",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["slug"] == analysis["season"]["season"]
        assert body["groups"]["core"]

    async def test_palette_hidden_from_other_users(
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
            f"/api/v1/analyses/{created.json()['analysisId']}/palette",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert response.status_code == 404


class TestFavouriteColours:
    async def favourite_first_core_colour(
        self, app_client: httpx.AsyncClient, token: str
    ) -> str:
        season = await app_client.get("/api/v1/seasons/spring")
        colour_id: str = season.json()["groups"]["core"][0]["id"]
        response = await app_client.post(
            f"/api/v1/colours/{colour_id}/favourite",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 204
        return colour_id

    async def test_favourite_roundtrip(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token = await users.create()
        colour_id = await self.favourite_first_core_colour(app_client, token)

        listing = await app_client.get(
            "/api/v1/me/favourite-colours", headers={"Authorization": f"Bearer {token}"}
        )
        assert listing.status_code == 200
        assert [item["id"] for item in listing.json()] == [colour_id]

        season = await app_client.get(
            "/api/v1/seasons/spring", headers={"Authorization": f"Bearer {token}"}
        )
        flagged = [c for c in season.json()["groups"]["core"] if c["id"] == colour_id]
        assert flagged and flagged[0]["isFavourite"] is True

        removed = await app_client.delete(
            f"/api/v1/colours/{colour_id}/favourite",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert removed.status_code == 204
        empty = await app_client.get(
            "/api/v1/me/favourite-colours", headers={"Authorization": f"Bearer {token}"}
        )
        assert empty.json() == []

    async def test_favourites_are_private(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token_a = await users.create()
        _, token_b = await users.create()
        await self.favourite_first_core_colour(app_client, token_a)
        listing_b = await app_client.get(
            "/api/v1/me/favourite-colours", headers={"Authorization": f"Bearer {token_b}"}
        )
        assert listing_b.json() == []

    async def test_favourite_requires_auth(self, app_client: httpx.AsyncClient) -> None:
        season = await app_client.get("/api/v1/seasons/spring")
        colour_id = season.json()["groups"]["core"][0]["id"]
        response = await app_client.post(f"/api/v1/colours/{colour_id}/favourite")
        assert response.status_code == 401
