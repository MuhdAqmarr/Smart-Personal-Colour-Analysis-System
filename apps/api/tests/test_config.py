from __future__ import annotations

import pytest
from app.core.config import Settings


def test_development_defaults_are_usable() -> None:
    settings = Settings(app_env="development", _env_file=None)
    assert settings.app_name == "coloursense-api"
    assert settings.max_image_size_bytes == 10 * 1024 * 1024
    assert "http://localhost:3000" in settings.cors_origins


def test_production_requires_critical_variables() -> None:
    with pytest.raises(ValueError) as excinfo:
        Settings(app_env="production", _env_file=None)
    message = str(excinfo.value)
    assert "SUPABASE_URL" in message
    assert "DATABASE_URL" in message


def test_production_with_all_variables_boots() -> None:
    settings = Settings(
        app_env="production",
        supabase_url="https://example.supabase.co",
        supabase_anon_key="anon",
        supabase_service_role_key="service",
        supabase_jwt_secret="secret",
        database_url="postgresql+asyncpg://user:pass@host/db",
        frontend_url="https://coloursense.example",
        _env_file=None,
    )
    assert settings.cors_origins == ["https://coloursense.example"]


def test_frontend_url_trailing_slash_stripped() -> None:
    settings = Settings(frontend_url="http://localhost:3000/", _env_file=None)
    assert settings.frontend_url == "http://localhost:3000"
