"""Product catalogue queries and favourite ownership."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

VALID_CATEGORIES = {
    "tops",
    "shirts",
    "dresses",
    "outerwear",
    "trousers",
    "skirts",
    "scarves",
    "hijabs",
    "accessories",
    "shoes",
    "bags",
    "cosmetics",
}

VALID_SORTS = {"newest", "price_asc", "price_desc", "name"}

_SORT_SQL = {
    "newest": "p.updated_at desc",
    "price_asc": "p.price asc nulls last",
    "price_desc": "p.price desc nulls last",
    "name": "p.name asc",
}

_PRODUCT_SELECT = """
    select p.id, p.name, p.brand, p.category, p.gender, p.description,
           p.image_url, p.product_url, p.price, p.original_price, p.currency,
           p.availability, p.is_demo, p.updated_at,
           st.slug as store_slug, st.name as store_name,
           coalesce(colours.list, '[]') as colours,
           coalesce(tags.list, '[]') as season_tags
    from public.products p
    join public.stores st on st.id = p.store_id
    left join lateral (
      select json_agg(json_build_object(
        'colour_name', pc.colour_name, 'hex', pc.hex,
        'lab_l', pc.lab_l, 'lab_a', pc.lab_a, 'lab_b', pc.lab_b,
        'is_primary', pc.is_primary
      ) order by pc.is_primary desc) as list
      from public.product_colours pc where pc.product_id = p.id
    ) colours on true
    left join lateral (
      select json_agg(json_build_object(
        'season_slug', t.season_slug, 'subseason_slug', t.subseason_slug
      )) as list
      from public.product_season_tags t where t.product_id = p.id
    ) tags on true
"""


async def list_products(
    session: AsyncSession,
    *,
    category: str | None,
    gender: str | None,
    season_slug: str | None,
    store_slug: str | None,
    search: str | None,
    page: int,
    page_size: int,
    sort: str,
) -> tuple[list[dict[str, Any]], int]:
    conditions = ["p.is_active", "st.is_active"]
    params: dict[str, Any] = {"limit": page_size, "offset": (page - 1) * page_size}

    if category:
        conditions.append("p.category = :category")
        params["category"] = category
    if gender:
        conditions.append("(p.gender = :gender or p.gender = 'unisex')")
        params["gender"] = gender
    if store_slug:
        conditions.append("st.slug = :store_slug")
        params["store_slug"] = store_slug
    if season_slug:
        conditions.append(
            "exists (select 1 from public.product_season_tags t "
            "where t.product_id = p.id and t.season_slug = :season_slug)"
        )
        params["season_slug"] = season_slug
    if search:
        conditions.append("(p.name ilike :search or p.brand ilike :search)")
        params["search"] = f"%{search}%"

    where = " and ".join(conditions)
    order = _SORT_SQL.get(sort, _SORT_SQL["newest"])

    total = (
        await session.execute(
            text(
                f"select count(*) from public.products p "  # noqa: S608
                f"join public.stores st on st.id = p.store_id where {where}"
            ),
            params,
        )
    ).scalar_one()

    rows = await session.execute(
        text(f"{_PRODUCT_SELECT} where {where} order by {order} limit :limit offset :offset"),  # noqa: S608
        params,
    )
    return [dict(row) for row in rows.mappings()], int(total)


async def get_product(session: AsyncSession, product_id: UUID) -> dict[str, Any] | None:
    row = (
        (
            await session.execute(
                text(f"{_PRODUCT_SELECT} where p.id = :product_id and p.is_active"),  # noqa: S608
                {"product_id": str(product_id)},
            )
        )
        .mappings()
        .first()
    )
    return dict(row) if row else None


async def list_active_products_for_ranking(session: AsyncSession) -> list[dict[str, Any]]:
    rows = await session.execute(
        text(f"{_PRODUCT_SELECT} where p.is_active and st.is_active")  # noqa: S608
    )
    return [dict(row) for row in rows.mappings()]


async def recommended_palette_labs(
    session: AsyncSession, season_slug: str, subseason_slug: str | None
) -> list[tuple[float, float, float]]:
    """Lab values of the recommended palette (cautious group excluded)."""
    rows = await session.execute(
        text(
            """
            select pc.lab_l, pc.lab_a, pc.lab_b
            from public.palette_colours pc
            join public.colour_seasons s on s.id = pc.season_id
            left join public.colour_subseasons ss on ss.id = pc.subseason_id
            where s.slug = :season_slug
              and pc.is_active
              and pc.palette_group != 'cautious'
              and (pc.subseason_id is null or ss.slug = :subseason_slug)
            """
        ),
        {"season_slug": season_slug, "subseason_slug": subseason_slug},
    )
    return [(float(r[0]), float(r[1]), float(r[2])) for r in rows]


async def list_favourite_product_ids(session: AsyncSession, user_id: UUID) -> set[str]:
    rows = await session.execute(
        text("select product_id from public.user_favourite_products where user_id = :uid"),
        {"uid": str(user_id)},
    )
    return {str(row[0]) for row in rows}


async def add_favourite_product(session: AsyncSession, user_id: UUID, product_id: UUID) -> bool:
    exists = (
        await session.execute(
            text("select 1 from public.products where id = :id and is_active"),
            {"id": str(product_id)},
        )
    ).first()
    if exists is None:
        return False
    await session.execute(
        text(
            """
            insert into public.user_favourite_products (user_id, product_id)
            values (:uid, :pid)
            on conflict (user_id, product_id) do nothing
            """
        ),
        {"uid": str(user_id), "pid": str(product_id)},
    )
    return True


async def remove_favourite_product(session: AsyncSession, user_id: UUID, product_id: UUID) -> bool:
    row = (
        await session.execute(
            text(
                """
                delete from public.user_favourite_products
                where user_id = :uid and product_id = :pid
                returning id
                """
            ),
            {"uid": str(user_id), "pid": str(product_id)},
        )
    ).first()
    return row is not None


async def list_favourite_products(session: AsyncSession, user_id: UUID) -> list[dict[str, Any]]:
    rows = await session.execute(
        text(
            f"""
            {_PRODUCT_SELECT}
            join public.user_favourite_products fav
              on fav.product_id = p.id and fav.user_id = :uid
            where p.is_active
            order by fav.created_at desc
            """  # noqa: S608
        ),
        {"uid": str(user_id)},
    )
    return [dict(row) for row in rows.mappings()]
