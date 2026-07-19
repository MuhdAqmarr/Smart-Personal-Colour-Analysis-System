"""Application settings.

All configuration comes from environment variables (see `.env.example`).
Settings are validated at import of the app factory; production refuses to
start when critical variables are missing, with a clear error listing them.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["development", "test", "production"]


def _default_classifier_config_path() -> Path:
    """Resolve the classifier config in both repo and container layouts."""
    here = Path(__file__).resolve()
    candidates = [
        # Repo layout: <root>/packages/colour-engine/config/classifier-v1.json
        here.parents[4] / "packages" / "colour-engine" / "config" / "classifier-v1.json"
        if len(here.parents) >= 5
        else None,
        # Container layout: /app/config/classifier-v1.json
        here.parents[2] / "config" / "classifier-v1.json" if len(here.parents) >= 3 else None,
    ]
    for candidate in candidates:
        if candidate is not None and candidate.exists():
            return candidate
    # Fall back to the repo-layout path for a readable startup error.
    return here.parents[4] / "packages" / "colour-engine" / "config" / "classifier-v1.json"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: AppEnv = "development"
    app_name: str = "coloursense-api"
    app_version: str = "0.1.0"
    api_host: str = "127.0.0.1"
    api_port: int = 8000

    frontend_url: str = "http://localhost:3000"

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    database_url: str = ""

    max_image_size_mb: int = 10
    image_storage_enabled: bool = True
    rate_limit: str = "10/minute"
    log_level: str = "INFO"

    classifier_config_path: Path = _default_classifier_config_path()

    @field_validator("frontend_url")
    @classmethod
    def _strip_trailing_slash(cls, value: str) -> str:
        return value.rstrip("/")

    @property
    def cors_origins(self) -> list[str]:
        origins = {self.frontend_url}
        if self.app_env != "production":
            # Local dev server and the dedicated Playwright port (3100).
            origins.update(
                {
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "http://localhost:3100",
                    "http://127.0.0.1:3100",
                }
            )
        return sorted(origins)

    @property
    def max_image_size_bytes(self) -> int:
        return self.max_image_size_mb * 1024 * 1024

    @model_validator(mode="after")
    def _validate_production_requirements(self) -> Settings:
        if self.app_env != "production":
            return self
        missing: list[str] = []
        required = {
            "SUPABASE_URL": self.supabase_url,
            "SUPABASE_ANON_KEY": self.supabase_anon_key,
            "DATABASE_URL": self.database_url,
            "FRONTEND_URL": self.frontend_url,
        }
        if self.image_storage_enabled:
            required["SUPABASE_SERVICE_ROLE_KEY"] = self.supabase_service_role_key
        missing = [name for name, value in required.items() if not value]
        if not self.supabase_jwt_secret and not self.supabase_url:
            missing.append("SUPABASE_JWT_SECRET (or SUPABASE_URL for JWKS verification)")
        if missing:
            joined = ", ".join(sorted(missing))
            raise ValueError(
                f"Refusing to start in production with missing environment variables: {joined}. "
                "See apps/api/.env.example for documentation of every variable."
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
