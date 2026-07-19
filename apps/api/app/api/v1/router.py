from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import admin, analyses, health, me, products, seasons

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(me.router)
api_router.include_router(analyses.router)
api_router.include_router(seasons.router)
api_router.include_router(products.router)
api_router.include_router(admin.router)
