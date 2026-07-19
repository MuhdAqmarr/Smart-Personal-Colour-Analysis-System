from __future__ import annotations

from typing import Literal

from app.schemas.common import CamelModel


class HealthResponse(CamelModel):
    status: Literal["ok"]
    name: str
    version: str
    environment: str


class ReadinessResponse(CamelModel):
    status: Literal["ready", "degraded"]
    checks: dict[str, Literal["ok", "failed", "skipped"]]
