"""Async database engine and session management.

The backend connects with privileged credentials and therefore enforces
ownership and role checks in every query (see repositories/); RLS protects
the direct PostgREST surface independently.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import Request
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.errors import AppError


class DatabaseNotConfiguredError(AppError):
    code = "SERVICE_UNAVAILABLE"
    status_code = 503
    default_message = "The database is not configured on this server."


def normalise_database_url(url: str) -> str:
    """Accept plain postgres URLs and upgrade them to the asyncpg driver."""
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def create_engine(database_url: str) -> AsyncEngine:
    return create_async_engine(
        normalise_database_url(database_url),
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        pool_recycle=1800,
    )


def create_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session(request: Request) -> AsyncIterator[AsyncSession]:
    """FastAPI dependency yielding a session from the app-level factory."""
    factory: async_sessionmaker[AsyncSession] | None = getattr(
        request.app.state, "db_session_factory", None
    )
    if factory is None:
        raise DatabaseNotConfiguredError()
    async with factory() as session:
        yield session
