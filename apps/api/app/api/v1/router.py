from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import analyses, health, me, seasons

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(me.router)
api_router.include_router(analyses.router)
api_router.include_router(seasons.router)
