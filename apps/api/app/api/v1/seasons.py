"""Public palette catalogue + analysis palette + favourite colours."""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.core.errors import NotFoundError
from app.repositories import palettes as repo
from app.schemas.common import CamelModel
from app.security.auth import CurrentUser, get_optional_user

router = APIRouter(tags=["palettes"])


class SubSeasonSchema(CamelModel):
    slug: str
    name: str
    description: str


class SeasonSummarySchema(CamelModel):
    slug: str
    name: str
    tagline: str
    description: str
    characteristics: dict[str, Any]
    sub_seasons: list[SubSeasonSchema]


class PaletteColourSchema(CamelModel):
    id: str
    name: str
    hex: str
    lab_l: float
    lab_a: float
    lab_b: float
    palette_group: str
    colour_family: str
    recommended_use: str
    subseason_slug: str | None
    is_favourite: bool = False


class CosmeticSchema(CamelModel):
    id: str
    product_type: str
    name: str
    hex: str
    intensity: str
    occasion: str
    usage_note: str


class SeasonDetailSchema(CamelModel):
    slug: str
    name: str
    tagline: str
    description: str
    characteristics: dict[str, Any]
    applied_subseason: str | None
    groups: dict[str, list[PaletteColourSchema]]
    cosmetics: list[CosmeticSchema]


class FavouriteColourSchema(CamelModel):
    id: str
    name: str
    hex: str
    palette_group: str
    recommended_use: str
    season_slug: str
    season_name: str


def _to_detail_schema(
    detail: dict[str, Any],
    applied_subseason: str | None,
    favourite_ids: set[str],
) -> SeasonDetailSchema:
    season = detail["season"]
    groups = {
        group: [
            PaletteColourSchema(
                id=str(colour["id"]),
                name=colour["name"],
                hex=colour["hex"],
                lab_l=float(colour["lab_l"]),
                lab_a=float(colour["lab_a"]),
                lab_b=float(colour["lab_b"]),
                palette_group=colour["palette_group"],
                colour_family=colour["colour_family"],
                recommended_use=colour["recommended_use"],
                subseason_slug=colour["subseason_slug"],
                is_favourite=str(colour["id"]) in favourite_ids,
            )
            for colour in colours
        ]
        for group, colours in detail["groups"].items()
        if colours
    }
    return SeasonDetailSchema(
        slug=season["slug"],
        name=season["name"],
        tagline=season["tagline"],
        description=season["description"],
        characteristics=season["characteristics"],
        applied_subseason=applied_subseason,
        groups=groups,
        cosmetics=[
            CosmeticSchema(
                id=str(cosmetic["id"]),
                product_type=cosmetic["product_type"],
                name=cosmetic["name"],
                hex=cosmetic["hex"],
                intensity=cosmetic["intensity"],
                occasion=cosmetic["occasion"],
                usage_note=cosmetic["usage_note"],
            )
            for cosmetic in detail["cosmetics"]
        ],
    )


@router.get("/seasons", response_model=list[SeasonSummarySchema])
async def list_seasons(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[SeasonSummarySchema]:
    rows = await repo.list_seasons(session)
    return [
        SeasonSummarySchema(
            slug=row["slug"],
            name=row["name"],
            tagline=row["tagline"],
            description=row["description"],
            characteristics=row["characteristics"],
            sub_seasons=[SubSeasonSchema(**sub) for sub in row["sub_seasons"]],
        )
        for row in rows
    ]


@router.get("/seasons/{season_slug}", response_model=SeasonDetailSchema)
async def get_season(
    season_slug: str,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    subseason: Annotated[str | None, Query(max_length=40)] = None,
) -> SeasonDetailSchema:
    """Public season palette; sub-season signature colours merged on request.
    Favourite flags are filled in when a valid token is supplied."""
    detail = await repo.get_season_detail(session, season_slug, subseason)
    if detail is None:
        raise NotFoundError("Unknown colour season.")
    user = await get_optional_user(request)
    favourite_ids = await repo.list_favourite_colour_ids(session, user.user_id) if user else set()
    return _to_detail_schema(detail, subseason, favourite_ids)


@router.get("/analyses/{analysis_id}/palette", response_model=SeasonDetailSchema)
async def get_analysis_palette(
    analysis_id: UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SeasonDetailSchema:
    """The palette resolved for one owned analysis (season + sub-season)."""
    slugs = await repo.get_analysis_palette_slugs(session, user.user_id, analysis_id)
    if slugs is None:
        raise NotFoundError("This analysis does not exist or belongs to another account.")
    season_slug, subseason_slug = slugs
    detail = await repo.get_season_detail(session, season_slug, subseason_slug)
    if detail is None:
        raise NotFoundError("The season for this analysis is no longer available.")
    favourite_ids = await repo.list_favourite_colour_ids(session, user.user_id)
    return _to_detail_schema(detail, subseason_slug, favourite_ids)


@router.get("/me/favourite-colours", response_model=list[FavouriteColourSchema])
async def list_favourites(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[FavouriteColourSchema]:
    rows = await repo.list_favourite_colours(session, user.user_id)
    return [
        FavouriteColourSchema(
            id=str(row["id"]),
            name=row["name"],
            hex=row["hex"],
            palette_group=row["palette_group"],
            recommended_use=row["recommended_use"],
            season_slug=row["season_slug"],
            season_name=row["season_name"],
        )
        for row in rows
    ]


@router.post("/colours/{palette_colour_id}/favourite", status_code=204)
async def favourite_colour(
    palette_colour_id: UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    added = await repo.add_favourite_colour(session, user.user_id, palette_colour_id)
    if not added:
        raise NotFoundError("This colour does not exist.")
    await session.commit()


@router.delete("/colours/{palette_colour_id}/favourite", status_code=204)
async def unfavourite_colour(
    palette_colour_id: UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    removed = await repo.remove_favourite_colour(session, user.user_id, palette_colour_id)
    if not removed:
        raise NotFoundError("This colour is not in your favourites.")
    await session.commit()
