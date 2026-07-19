from __future__ import annotations

from fastapi import APIRouter, Request

from app.core.classifier import ClassifierConfigError, get_classifier_config
from app.core.config import get_settings
from app.schemas.health import HealthResponse, ReadinessResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        name=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
    )


@router.get("/readiness", response_model=ReadinessResponse)
async def readiness(request: Request) -> ReadinessResponse:
    settings = get_settings()
    checks: dict[str, str] = {}

    try:
        config = get_classifier_config()
        checks["classifier_config"] = "ok" if config.version else "failed"
    except ClassifierConfigError:
        checks["classifier_config"] = "failed"

    # The database check is wired up in Phase 2; report it honestly until then.
    if not settings.database_url:
        checks["database"] = "skipped"
    else:
        engine = getattr(request.app.state, "db_engine", None)
        if engine is None:
            checks["database"] = "skipped"
        else:
            try:
                from sqlalchemy import text

                async with engine.connect() as connection:
                    await connection.execute(text("SELECT 1"))
                checks["database"] = "ok"
            except Exception:  # pragma: no cover - exercised in integration tests
                checks["database"] = "failed"

    status: str = "ready" if all(value != "failed" for value in checks.values()) else "degraded"
    return ReadinessResponse.model_validate({"status": status, "checks": checks})
