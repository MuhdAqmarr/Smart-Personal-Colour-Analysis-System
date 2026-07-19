"""Read access to the palette catalogue and favourite-colour ownership."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

PALETTE_GROUP_ORDER = [
    "neutrals",
    "core",
    "accents",
    "formal",
    "casual",
    "accessories",
    "headwear",
    "cautious",
]


async def list_seasons(session: AsyncSession) -> list[dict[str, Any]]:
    rows = await session.execute(
        text(
            """
            select s.id, s.slug, s.name, s.tagline, s.description, s.characteristics,
                   s.display_order,
                   coalesce(
                     json_agg(
                       json_build_object(
                         'slug', ss.slug, 'name', ss.name, 'description', ss.description
                       ) order by ss.display_order
                     ) filter (where ss.id is not null and ss.is_active),
                     '[]'
                   ) as sub_seasons
            from public.colour_seasons s
            left join public.colour_subseasons ss on ss.season_id = s.id
            where s.is_active
            group by s.id
            order by s.display_order
            """
        )
    )
    return [dict(row) for row in rows.mappings()]


async def get_season_detail(
    session: AsyncSession, season_slug: str, subseason_slug: str | None = None
) -> dict[str, Any] | None:
    """Season with grouped palette colours and cosmetics.

    Season-wide colours (subseason_id IS NULL) are always included; when a
    sub-season is given, its signature colours are merged in front of their
    group.
    """
    season = (
        (
            await session.execute(
                text(
                    """
                select id, slug, name, tagline, description, characteristics
                from public.colour_seasons
                where slug = :slug and is_active
                """
                ),
                {"slug": season_slug},
            )
        )
        .mappings()
        .first()
    )
    if season is None:
        return None

    colours = await session.execute(
        text(
            """
            select pc.id, pc.name, pc.hex, pc.lab_l, pc.lab_a, pc.lab_b,
                   pc.palette_group, pc.colour_family, pc.recommended_use,
                   pc.priority, ss.slug as subseason_slug
            from public.palette_colours pc
            left join public.colour_subseasons ss on ss.id = pc.subseason_id
            where pc.season_id = :season_id
              and pc.is_active
              and (pc.subseason_id is null or ss.slug = :subseason_slug)
            order by pc.priority, pc.name
            """
        ),
        {"season_id": season["id"], "subseason_slug": subseason_slug},
    )

    groups: dict[str, list[dict[str, Any]]] = {group: [] for group in PALETTE_GROUP_ORDER}
    for row in colours.mappings():
        colour = dict(row)
        group = colour["palette_group"]
        groups.setdefault(group, [])
        if colour["subseason_slug"]:
            groups[group].insert(0, colour)
        else:
            groups[group].append(colour)

    cosmetics = await session.execute(
        text(
            """
            select id, product_type, name, hex, intensity, occasion, usage_note, priority
            from public.cosmetic_recommendations
            where season_id = :season_id and is_active
            order by product_type, priority, name
            """
        ),
        {"season_id": season["id"]},
    )

    return {
        "season": dict(season),
        "groups": groups,
        "cosmetics": [dict(row) for row in cosmetics.mappings()],
    }


async def get_analysis_palette_slugs(
    session: AsyncSession, user_id: UUID, analysis_id: UUID
) -> tuple[str, str | None] | None:
    row = (
        await session.execute(
            text(
                """
                select season_slug, subseason_slug from public.analyses
                where id = :analysis_id and user_id = :user_id
                """
            ),
            {"analysis_id": str(analysis_id), "user_id": str(user_id)},
        )
    ).first()
    if row is None:
        return None
    return str(row[0]), row[1]


async def list_favourite_colour_ids(session: AsyncSession, user_id: UUID) -> set[str]:
    rows = await session.execute(
        text("select palette_colour_id from public.user_favourite_colours where user_id = :uid"),
        {"uid": str(user_id)},
    )
    return {str(row[0]) for row in rows}


async def add_favourite_colour(
    session: AsyncSession, user_id: UUID, palette_colour_id: UUID
) -> bool:
    exists = (
        await session.execute(
            text("select 1 from public.palette_colours where id = :id and is_active"),
            {"id": str(palette_colour_id)},
        )
    ).first()
    if exists is None:
        return False
    await session.execute(
        text(
            """
            insert into public.user_favourite_colours (user_id, palette_colour_id)
            values (:uid, :cid)
            on conflict (user_id, palette_colour_id) do nothing
            """
        ),
        {"uid": str(user_id), "cid": str(palette_colour_id)},
    )
    return True


async def remove_favourite_colour(
    session: AsyncSession, user_id: UUID, palette_colour_id: UUID
) -> bool:
    row = (
        await session.execute(
            text(
                """
                delete from public.user_favourite_colours
                where user_id = :uid and palette_colour_id = :cid
                returning id
                """
            ),
            {"uid": str(user_id), "cid": str(palette_colour_id)},
        )
    ).first()
    return row is not None


async def list_favourite_colours(session: AsyncSession, user_id: UUID) -> list[dict[str, Any]]:
    rows = await session.execute(
        text(
            """
            select pc.id, pc.name, pc.hex, pc.palette_group, pc.recommended_use,
                   s.slug as season_slug, s.name as season_name, fav.created_at
            from public.user_favourite_colours fav
            join public.palette_colours pc on pc.id = fav.palette_colour_id
            join public.colour_seasons s on s.id = pc.season_id
            where fav.user_id = :uid
            order by fav.created_at desc
            """
        ),
        {"uid": str(user_id)},
    )
    return [dict(row) for row in rows.mappings()]
