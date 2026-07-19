from __future__ import annotations

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import get_db_session
from app.core.errors import NotFoundError
from app.core.logging import get_logger
from app.schemas.common import CamelModel
from app.security.auth import CurrentUser
from app.services.storage import StorageUnavailableError, get_storage

logger = get_logger(__name__)

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


class PreferencesUpdate(CamelModel):
    default_image_storage: bool | None = None
    preferred_currency: str | None = Field(default=None, min_length=3, max_length=3)
    reduced_motion: bool | None = None


class PreferencesResponse(CamelModel):
    default_image_storage: bool
    preferred_currency: str
    reduced_motion: bool


@router.get("/me/preferences", response_model=PreferencesResponse)
async def read_preferences(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PreferencesResponse:
    row = (
        (
            await session.execute(
                text(
                    """
                insert into public.user_preferences (user_id)
                values (:user_id)
                on conflict (user_id) do update set user_id = excluded.user_id
                returning default_image_storage, preferred_currency, reduced_motion
                """
                ),
                {"user_id": str(user.user_id)},
            )
        )
        .mappings()
        .one()
    )
    await session.commit()
    return PreferencesResponse(
        default_image_storage=row["default_image_storage"],
        preferred_currency=row["preferred_currency"].strip(),
        reduced_motion=row["reduced_motion"],
    )


@router.patch("/me/preferences", response_model=PreferencesResponse)
async def update_preferences(
    payload: PreferencesUpdate,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PreferencesResponse:
    row = (
        (
            await session.execute(
                text(
                    """
                insert into public.user_preferences
                  (user_id, default_image_storage, preferred_currency, reduced_motion)
                values (:user_id, coalesce(:dis, false), coalesce(:cur, 'MYR'),
                        coalesce(:rm, false))
                on conflict (user_id) do update set
                  default_image_storage =
                    coalesce(:dis, public.user_preferences.default_image_storage),
                  preferred_currency = coalesce(:cur, public.user_preferences.preferred_currency),
                  reduced_motion = coalesce(:rm, public.user_preferences.reduced_motion)
                returning default_image_storage, preferred_currency, reduced_motion
                """
                ),
                {
                    "user_id": str(user.user_id),
                    "dis": payload.default_image_storage,
                    "cur": payload.preferred_currency.upper()
                    if payload.preferred_currency
                    else None,
                    "rm": payload.reduced_motion,
                },
            )
        )
        .mappings()
        .one()
    )
    await session.commit()
    return PreferencesResponse(
        default_image_storage=row["default_image_storage"],
        preferred_currency=row["preferred_currency"].strip(),
        reduced_motion=row["reduced_motion"],
    )


class ConsentRecord(CamelModel):
    consent_type: Literal["image_analysis", "image_storage", "questionnaire"]
    granted: bool


@router.post("/me/consents", status_code=204)
async def record_consent(
    payload: ConsentRecord,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """Append a consent event (append-only log; latest row wins)."""
    await session.execute(
        text(
            """
            insert into public.user_consents (user_id, consent_type, granted)
            values (:user_id, :consent_type, :granted)
            """
        ),
        {
            "user_id": str(user.user_id),
            "consent_type": payload.consent_type,
            "granted": payload.granted,
        },
    )
    await session.commit()


class ProfileUpdate(CamelModel):
    display_name: str = Field(min_length=1, max_length=120)


@router.patch("/me", response_model=MeResponse)
async def update_profile(
    payload: ProfileUpdate,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeResponse:
    row = (
        (
            await session.execute(
                text(
                    """
                update public.profiles set display_name = :display_name
                where id = :user_id
                returning id, display_name, role
                """
                ),
                {"user_id": str(user.user_id), "display_name": payload.display_name.strip()},
            )
        )
        .mappings()
        .first()
    )
    if row is None:
        raise NotFoundError("Profile not found.")
    await session.commit()
    return MeResponse(
        id=row["id"],
        email=user.email,
        display_name=row["display_name"],
        role=row["role"],
        default_image_storage=False,
    )


@router.delete("/me/analyses", status_code=204)
async def delete_all_analyses(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """Delete the user's complete analysis history (and stored images)."""
    await session.execute(
        text("delete from public.analyses where user_id = :user_id"),
        {"user_id": str(user.user_id)},
    )
    await session.commit()
    try:
        storage = get_storage(get_settings())
        paths = await storage.list_user_objects(str(user.user_id))
        await storage.delete(paths)
    except StorageUnavailableError:
        pass


@router.delete("/me", status_code=204)
async def delete_account(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """Delete the account and every record the user owns.

    Removing the auth.users row cascades through profiles into analyses,
    preferences, consents, and favourites; stored images are removed from
    the private bucket first.
    """
    try:
        storage = get_storage(get_settings())
        paths = await storage.list_user_objects(str(user.user_id))
        await storage.delete(paths)
    except StorageUnavailableError:
        logger.info("account_deletion_storage_skipped", reason="not_configured")

    await session.execute(
        text("delete from auth.users where id = :user_id"),
        {"user_id": str(user.user_id)},
    )
    await session.commit()
