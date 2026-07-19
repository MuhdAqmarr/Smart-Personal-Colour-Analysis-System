from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.core.errors import NotFoundError
from app.schemas.common import CamelModel
from app.security.auth import CurrentUser

router = APIRouter(tags=["me"])


class MeResponse(CamelModel):
    id: UUID
    email: str | None
    display_name: str
    role: str
    default_image_storage: bool


@router.get("/me", response_model=MeResponse)
async def read_me(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeResponse:
    result = await session.execute(
        text(
            """
            select p.id, p.display_name, p.role,
                   coalesce(up.default_image_storage, false) as default_image_storage
            from public.profiles p
            left join public.user_preferences up on up.user_id = p.id
            where p.id = :user_id
            """
        ),
        {"user_id": str(user.user_id)},
    )
    row = result.mappings().first()
    if row is None:
        raise NotFoundError("Profile not found. Please sign in again.")
    return MeResponse(
        id=row["id"],
        email=user.email,
        display_name=row["display_name"],
        role=row["role"],
        default_image_storage=row["default_image_storage"],
    )
