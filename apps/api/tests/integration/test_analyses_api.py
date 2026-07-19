"""Integration tests: analysis persistence, ownership, and privacy flows.

Run with: uv run pytest -m integration (requires the docker-compose DB
prepared by scripts/db-reset.sh).
"""

from __future__ import annotations

import asyncpg
import httpx
import pytest

from tests import fixtures
from tests.integration.conftest import UserFactory

pytestmark = pytest.mark.integration


async def analyse(
    client: httpx.AsyncClient, token: str | None = None, **form: str
) -> httpx.Response:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return await client.post(
        "/api/v1/analyses",
        files={"image": ("face.jpg", fixtures.valid_face_bytes(), "image/jpeg")},
        data=form,
        headers=headers,
    )


class TestPersistence:
    async def test_guest_analysis_is_never_persisted(
        self, app_client: httpx.AsyncClient, db_conn: asyncpg.Connection
    ) -> None:
        before = await db_conn.fetchval("select count(*) from public.analyses")
        response = await analyse(app_client)
        assert response.status_code == 200
        assert response.json()["persisted"] is False
        after = await db_conn.fetchval("select count(*) from public.analyses")
        assert after == before

    async def test_authenticated_analysis_is_persisted_completely(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn: asyncpg.Connection
    ) -> None:
        user_id, token = await users.create()
        response = await analyse(app_client, token)
        assert response.status_code == 200
        body = response.json()
        assert body["persisted"] is True
        analysis_id = body["analysisId"]
        assert analysis_id

        row = await db_conn.fetchrow(
            "select * from public.analyses where id = $1", __import__("uuid").UUID(analysis_id)
        )
        assert row is not None
        assert str(row["user_id"]) == str(user_id)
        assert row["classifier_version"] == "1.0.0"

        for table, expected in (
            ("analysis_quality_metrics", 1),
            ("analysis_classifications", 1),
            ("analysis_colour_samples", 4),
        ):
            count = await db_conn.fetchval(
                f"select count(*) from public.{table} where analysis_id = $1",  # noqa: S608
                __import__("uuid").UUID(analysis_id),
            )
            assert count == expected, table

        # No image stored without opt-in.
        images = await db_conn.fetchval(
            "select count(*) from public.analysis_images where analysis_id = $1",
            __import__("uuid").UUID(analysis_id),
        )
        assert images == 0

    async def test_history_list_and_detail_roundtrip(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token = await users.create()
        created = await analyse(app_client, token)
        analysis_id = created.json()["analysisId"]

        listing = await app_client.get(
            "/api/v1/analyses", headers={"Authorization": f"Bearer {token}"}
        )
        assert listing.status_code == 200
        body = listing.json()
        assert body["pagination"]["totalItems"] == 1
        assert body["items"][0]["id"] == analysis_id
        assert body["items"][0]["combinedHex"].startswith("#")

        detail = await app_client.get(
            f"/api/v1/analyses/{analysis_id}", headers={"Authorization": f"Bearer {token}"}
        )
        assert detail.status_code == 200
        detail_body = detail.json()
        assert detail_body["id"] == analysis_id
        assert len(detail_body["samples"]) == 4
        assert detail_body["quality"]["overall_score"] is not None
        assert detail_body["hasImage"] is False


class TestOwnership:
    async def test_user_cannot_read_anothers_analysis(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token_a = await users.create()
        _, token_b = await users.create()
        created = await analyse(app_client, token_a)
        analysis_id = created.json()["analysisId"]

        response = await app_client.get(
            f"/api/v1/analyses/{analysis_id}", headers={"Authorization": f"Bearer {token_b}"}
        )
        assert response.status_code == 404

    async def test_user_cannot_delete_anothers_analysis(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn: asyncpg.Connection
    ) -> None:
        _, token_a = await users.create()
        _, token_b = await users.create()
        created = await analyse(app_client, token_a)
        analysis_id = created.json()["analysisId"]

        response = await app_client.delete(
            f"/api/v1/analyses/{analysis_id}", headers={"Authorization": f"Bearer {token_b}"}
        )
        assert response.status_code == 404
        still_there = await db_conn.fetchval(
            "select count(*) from public.analyses where id = $1",
            __import__("uuid").UUID(analysis_id),
        )
        assert still_there == 1

    async def test_owner_can_delete_analysis(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn: asyncpg.Connection
    ) -> None:
        _, token = await users.create()
        created = await analyse(app_client, token)
        analysis_id = created.json()["analysisId"]

        response = await app_client.delete(
            f"/api/v1/analyses/{analysis_id}", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 204
        remaining = await db_conn.fetchval(
            "select count(*) from public.analyses where id = $1",
            __import__("uuid").UUID(analysis_id),
        )
        assert remaining == 0

    async def test_anonymous_cannot_list_history(self, app_client: httpx.AsyncClient) -> None:
        response = await app_client.get("/api/v1/analyses")
        assert response.status_code == 401


class TestPrivacy:
    async def test_preferences_roundtrip(
        self, app_client: httpx.AsyncClient, users: UserFactory
    ) -> None:
        _, token = await users.create()
        headers = {"Authorization": f"Bearer {token}"}

        initial = await app_client.get("/api/v1/me/preferences", headers=headers)
        assert initial.status_code == 200
        assert initial.json()["defaultImageStorage"] is False  # privacy default

        updated = await app_client.patch(
            "/api/v1/me/preferences",
            headers=headers,
            json={"defaultImageStorage": True, "preferredCurrency": "sgd"},
        )
        assert updated.status_code == 200
        body = updated.json()
        assert body["defaultImageStorage"] is True
        assert body["preferredCurrency"] == "SGD"

    async def test_consent_events_are_recorded(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn: asyncpg.Connection
    ) -> None:
        user_id, token = await users.create()
        response = await app_client.post(
            "/api/v1/me/consents",
            headers={"Authorization": f"Bearer {token}"},
            json={"consentType": "image_analysis", "granted": True},
        )
        assert response.status_code == 204
        count = await db_conn.fetchval(
            "select count(*) from public.user_consents where user_id = $1", user_id
        )
        assert count == 1

    async def test_delete_all_analyses(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn: asyncpg.Connection
    ) -> None:
        user_id, token = await users.create()
        await analyse(app_client, token)
        await analyse(app_client, token)

        response = await app_client.delete(
            "/api/v1/me/analyses", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 204
        remaining = await db_conn.fetchval(
            "select count(*) from public.analyses where user_id = $1", user_id
        )
        assert remaining == 0

    async def test_account_deletion_cascades_everything(
        self, app_client: httpx.AsyncClient, users: UserFactory, db_conn: asyncpg.Connection
    ) -> None:
        user_id, token = await users.create()
        await analyse(app_client, token)
        await app_client.post(
            "/api/v1/me/consents",
            headers={"Authorization": f"Bearer {token}"},
            json={"consentType": "image_analysis", "granted": True},
        )

        response = await app_client.delete(
            "/api/v1/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 204

        for table, column in (
            ("profiles", "id"),
            ("analyses", "user_id"),
            ("user_preferences", "user_id"),
            ("user_consents", "user_id"),
        ):
            count = await db_conn.fetchval(
                f"select count(*) from public.{table} where {column} = $1",  # noqa: S608
                user_id,
            )
            assert count == 0, table
