"""Integration tests for authentication against a real database.

Run with: uv run pytest -m integration
Requires the docker-compose database prepared by scripts/db-reset.sh.
"""

from __future__ import annotations

import httpx
import pytest

from tests.integration.conftest import UserFactory

pytestmark = pytest.mark.integration


async def test_me_requires_authentication(app_client: httpx.AsyncClient) -> None:
    response = await app_client.get("/api/v1/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"


async def test_me_rejects_invalid_token(app_client: httpx.AsyncClient) -> None:
    response = await app_client.get(
        "/api/v1/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


async def test_me_returns_profile_created_by_trigger(
    app_client: httpx.AsyncClient, users: UserFactory
) -> None:
    user_id, token = await users.create()
    response = await app_client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(user_id)
    assert body["role"] == "user"
    # Privacy default: image storage opt-in is off.
    assert body["defaultImageStorage"] is False


async def test_admin_role_visible_after_promotion(
    app_client: httpx.AsyncClient, users: UserFactory
) -> None:
    _, token = await users.create(role="admin")
    response = await app_client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


async def test_readiness_reports_database_ok(app_client: httpx.AsyncClient) -> None:
    response = await app_client.get("/api/v1/readiness")
    assert response.status_code == 200
    body = response.json()
    assert body["checks"]["database"] == "ok"
    assert body["status"] == "ready"
