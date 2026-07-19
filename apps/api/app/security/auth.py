"""Authentication and authorisation dependencies.

- `get_optional_user` / `require_user`: verify the bearer token.
- `require_admin`: verify the token AND check profiles.role in the database.
  The admin role is never trusted from client-supplied claims.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import get_db_session
from app.core.errors import ForbiddenError, UnauthenticatedError
from app.security.jwt import TokenClaims, verify_supabase_jwt


def _extract_bearer_token(request: Request) -> str | None:
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


async def get_optional_user(request: Request) -> TokenClaims | None:
    """Return verified claims when a bearer token is present, else None.

    Guests are legitimate callers of the analysis endpoints; an *invalid*
    token is still rejected outright rather than downgraded to guest.
    """
    token = _extract_bearer_token(request)
    if token is None:
        return None
    return verify_supabase_jwt(token, get_settings())


async def require_user(request: Request) -> TokenClaims:
    user = await get_optional_user(request)
    if user is None:
        raise UnauthenticatedError()
    return user


async def get_profile_role(session: AsyncSession, user_id: str) -> str | None:
    result = await session.execute(
        text("select role from public.profiles where id = :user_id"),
        {"user_id": user_id},
    )
    row = result.first()
    return None if row is None else str(row[0])


async def require_admin(
    user: Annotated[TokenClaims, Depends(require_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> TokenClaims:
    role = await get_profile_role(session, str(user.user_id))
    if role != "admin":
        raise ForbiddenError("Administrator access is required.")
    return user


OptionalUser = Annotated[TokenClaims | None, Depends(get_optional_user)]
CurrentUser = Annotated[TokenClaims, Depends(require_user)]
AdminUser = Annotated[TokenClaims, Depends(require_admin)]
