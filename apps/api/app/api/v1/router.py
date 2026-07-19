from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import health, me

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(me.router)
