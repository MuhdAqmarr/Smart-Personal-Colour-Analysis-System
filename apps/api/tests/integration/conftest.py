from __future__ import annotations

import os
import time
import uuid
from collections.abc import AsyncIterator
from typing import Any

import asyncpg
import httpx
import jwt as pyjwt
import pytest

INTEGRATION_DATABASE_URL = os.environ.get(
    "INTEGRATION_DATABASE_URL",
    "postgresql://coloursense:coloursense@localhost:54329/coloursense",
)
TEST_JWT_SECRET = "integration-test-secret"


def asyncpg_url() -> str:
    return INTEGRATION_DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")


@pytest.fixture
async def db_conn() -> AsyncIterator[asyncpg.Connection]:
    try:
        conn = await asyncpg.connect(asyncpg_url())
    except OSError:
        pytest.skip("integration database is not reachable")
    try:
        yield conn
    finally:
        await conn.close()


@pytest.fixture
async def app_client(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncIterator[httpx.AsyncClient]:
    """App wired to the integration database with a known JWT secret."""
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("DATABASE_URL", INTEGRATION_DATABASE_URL)
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_JWT_SECRET)

    from app.core.classifier import get_classifier_config
    from app.core.config import get_settings

    get_settings.cache_clear()
    get_classifier_config.cache_clear()

    from app.main import create_app

    app = create_app()
    # ASGITransport does not drive lifespan; enter it explicitly so the
    # database engine/session factory are created and disposed properly.
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            yield client

    get_settings.cache_clear()
    get_classifier_config.cache_clear()


class UserFactory:
    """Creates auth users directly (shim table) and mints matching tokens."""

    def __init__(self, conn: asyncpg.Connection) -> None:
        self.conn = conn
        self.created: list[uuid.UUID] = []

    async def create(self, *, role: str = "user") -> tuple[uuid.UUID, str]:
        user_id = uuid.uuid4()
        email = f"it-{user_id.hex[:12]}@test.local"
        await self.conn.execute(
            "INSERT INTO auth.users (id, email) VALUES ($1, $2)", user_id, email
        )
        if role == "admin":
            await self.conn.execute(
                "UPDATE public.profiles SET role = 'admin' WHERE id = $1", user_id
            )
        self.created.append(user_id)
        token = self.mint_token(user_id, email)
        return user_id, token

    @staticmethod
    def mint_token(user_id: uuid.UUID, email: str) -> str:
        payload: dict[str, Any] = {
            "sub": str(user_id),
            "aud": "authenticated",
            "role": "authenticated",
            "email": email,
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()) - 5,
        }
        return pyjwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")

    async def cleanup(self) -> None:
        if self.created:
            await self.conn.execute(
                "DELETE FROM auth.users WHERE id = ANY($1::uuid[])", self.created
            )


@pytest.fixture
async def users(db_conn: asyncpg.Connection) -> AsyncIterator[UserFactory]:
    factory = UserFactory(db_conn)
    yield factory
    await factory.cleanup()
