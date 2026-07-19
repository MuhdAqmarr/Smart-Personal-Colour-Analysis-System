from __future__ import annotations

import os
from collections.abc import AsyncIterator, Iterator

import httpx
import pytest

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", "")


@pytest.fixture(autouse=True)
def _reset_setting_caches() -> Iterator[None]:
    """Keep settings/config caches isolated between tests."""
    from app.core.classifier import get_classifier_config
    from app.core.config import get_settings

    get_settings.cache_clear()
    get_classifier_config.cache_clear()
    yield
    get_settings.cache_clear()
    get_classifier_config.cache_clear()


@pytest.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    from app.main import create_app

    app = create_app()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client
