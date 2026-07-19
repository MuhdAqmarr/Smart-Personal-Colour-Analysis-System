"""Public product directory, analysis recommendations, and favourites."""

from __future__ import annotations

import math
from typing import Annotated, Any
from uuid import UUID

import numpy as np
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.classifier import get_classifier_config
from app.core.db import get_db_session
from app.core.errors import NotFoundError, ValidationAppError
from app.repositories import palettes as palette_repo
from app.repositories import products as repo
from app.schemas.analysis import PaginationSchema
from app.schemas.common import CamelModel
from app.security.auth import CurrentUser
from app.services.product_ranking import rank_products

router = APIRouter(tags=["products"])


class ProductColourSchema(CamelModel):
    colour_name: str
    hex: str
    lab_l: float
    lab_a: float
    lab_b: float
    is_primary: bool


class ProductSeasonTagSchema(CamelModel):
    season_slug: str
    subseason_slug: str | None


class ProductSchema(CamelModel):
    id: str
    name: str
    brand: str
    category: str
    gender: str
    description: str
    image_url: str | None
    product_url: str
    price: float | None
    original_price: float | None
    currency: str
    availability: str
    is_demo: bool
    store_slug: str
    store_name: str
    colours: list[ProductColourSchema]
    season_tags: list[ProductSeasonTagSchema]
    is_favourite: bool = False
    match_score: float | None = None
    min_delta_e: float | None = None


class ProductListSchema(CamelModel):
    items: list[ProductSchema]
    pagination: PaginationSchema


def _to_schema(
    row: dict[str, Any],
    favourite_ids: set[str],
    *,
    match_score: float | None = None,
    min_delta_e: float | None = None,
) -> ProductSchema:
    return ProductSchema(
        id=str(row["id"]),
        name=row["name"],
        brand=row["brand"],
        category=row["category"],
        gender=row["gender"],
        description=row["description"],
        image_url=row["image_url"],
        product_url=row["product_url"],
        price=float(row["price"]) if row["price"] is not None else None,
        original_price=(
            float(row["original_price"]) if row["original_price"] is not None else None
        ),
        currency=row["currency"].strip(),
        availability=row["availability"],
        is_demo=row["is_demo"],
        store_slug=row["store_slug"],
        store_name=row["store_name"],
        colours=[
            ProductColourSchema(
                colour_name=colour["colour_name"],
                hex=colour["hex"],
                lab_l=float(colour["lab_l"]),
                lab_a=float(colour["lab_a"]),
                lab_b=float(colour["lab_b"]),
                is_primary=colour["is_primary"],
            )
            for colour in (row["colours"] or [])
        ],
        season_tags=[
            ProductSeasonTagSchema(
                season_slug=tag["season_slug"], subseason_slug=tag.get("subseason_slug")
            )
            for tag in (row["season_tags"] or [])
        ],
        is_favourite=str(row["id"]) in favourite_ids,
        match_score=match_score,
        min_delta_e=min_delta_e,
    )


@router.get("/products", response_model=ProductListSchema)
async def list_products(
    request_session: Annotated[AsyncSession, Depends(get_db_session)],
    category: Annotated[str | None, Query(max_length=30)] = None,
    gender: Annotated[str | None, Query(max_length=10)] = None,
    season: Annotated[str | None, Query(max_length=40)] = None,
    store: Annotated[str | None, Query(max_length=60)] = None,
    q: Annotated[str | None, Query(max_length=80)] = None,
    sort: Annotated[str, Query(max_length=20)] = "newest",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=48)] = 12,
) -> ProductListSchema:
    """Public product directory with filters, sorting, and pagination."""
    if category and category not in repo.VALID_CATEGORIES:
        raise ValidationAppError("Unknown product category.")
    if gender and gender not in ("women", "men", "unisex"):
        raise ValidationAppError("Unknown gender filter.")
    if sort not in repo.VALID_SORTS:
        raise ValidationAppError("Unknown sort order.")

    rows, total = await repo.list_products(
        request_session,
        category=category,
        gender=gender,
        season_slug=season,
        store_slug=store,
        search=q,
        page=page,
        page_size=page_size,
        sort=sort,
    )
    return ProductListSchema(
        items=[_to_schema(row, set()) for row in rows],
        pagination=PaginationSchema(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=max(1, math.ceil(total / page_size)) if total else 0,
        ),
    )


@router.get("/products/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductSchema:
    row = await repo.get_product(session, product_id)
    if row is None:
        raise NotFoundError("This product does not exist or is inactive.")
    return _to_schema(row, set())


@router.get("/analyses/{analysis_id}/recommended-products", response_model=list[ProductSchema])
async def recommended_products(
    analysis_id: UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ProductSchema]:
    """Products ranked for one owned analysis via the documented CIEDE2000
    formula (see docs/colour-analysis-methodology.md)."""
    slugs = await palette_repo.get_analysis_palette_slugs(session, user.user_id, analysis_id)
    if slugs is None:
        raise NotFoundError("This analysis does not exist or belongs to another account.")
    season_slug, subseason_slug = slugs

    palette_labs = np.array(
        await repo.recommended_palette_labs(session, season_slug, subseason_slug),
        dtype=np.float64,
    )
    products = await repo.list_active_products_for_ranking(session)
    config = get_classifier_config().productMatching

    ranked = rank_products(
        products,
        palette_labs,
        season_slug,
        subseason_slug,
        config.model_dump(),
    )[: config.maxRecommendations]

    by_id = {str(product["id"]): product for product in products}
    favourite_ids = await repo.list_favourite_product_ids(session, user.user_id)
    return [
        _to_schema(
            by_id[item.product_id],
            favourite_ids,
            match_score=item.score,
            min_delta_e=item.min_delta_e,
        )
        for item in ranked
        if item.product_id in by_id
    ]


@router.get("/me/favourite-products", response_model=list[ProductSchema])
async def list_favourite_products(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ProductSchema]:
    rows = await repo.list_favourite_products(session, user.user_id)
    return [_to_schema(row, {str(row["id"])}) for row in rows]


@router.post("/products/{product_id}/favourite", status_code=204)
async def favourite_product(
    product_id: UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    added = await repo.add_favourite_product(session, user.user_id, product_id)
    if not added:
        raise NotFoundError("This product does not exist.")
    await session.commit()


@router.delete("/products/{product_id}/favourite", status_code=204)
async def unfavourite_product(
    product_id: UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    removed = await repo.remove_favourite_product(session, user.user_id, product_id)
    if not removed:
        raise NotFoundError("This product is not in your favourites.")
    await session.commit()
