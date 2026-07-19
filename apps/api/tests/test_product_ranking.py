from __future__ import annotations

from typing import Any

import numpy as np
from app.services.product_ranking import rank_products

CONFIG = {
    "weights": {
        "paletteDistance": 0.5,
        "seasonTag": 0.2,
        "subSeasonTag": 0.1,
        "categoryRelevance": 0.1,
        "availability": 0.1,
    },
    "deltaE00Falloff": 25.0,
}

# A small warm palette (terracotta-ish Lab values).
PALETTE = np.array([[55.0, 30.0, 40.0], [45.0, 40.0, 30.0]])


def product(
    product_id: str,
    lab: tuple[float, float, float],
    *,
    category: str = "tops",
    availability: str = "in_stock",
    seasons: list[str] | None = None,
    subseasons: list[str | None] | None = None,
) -> dict[str, Any]:
    tags = []
    for index, season in enumerate(seasons or []):
        sub = (subseasons or [None] * len(seasons or []))[index]
        tags.append({"season_slug": season, "subseason_slug": sub})
    return {
        "id": product_id,
        "category": category,
        "availability": availability,
        "colours": [{"lab_l": lab[0], "lab_a": lab[1], "lab_b": lab[2]}],
        "season_tags": tags,
    }


def test_closer_colour_ranks_higher() -> None:
    close = product("close", (54.0, 31.0, 39.0), seasons=["autumn"])
    far = product("far", (60.0, -30.0, -40.0), seasons=["autumn"])
    ranked = rank_products([far, close], PALETTE, "autumn", None, CONFIG)
    assert [r.product_id for r in ranked] == ["close", "far"]
    assert ranked[0].min_delta_e is not None and ranked[0].min_delta_e < 5
    assert ranked[0].palette_proximity > ranked[1].palette_proximity


def test_season_tag_breaks_ties() -> None:
    lab = (54.0, 31.0, 39.0)
    tagged = product("tagged", lab, seasons=["autumn"])
    untagged = product("untagged", lab, seasons=["winter"])
    ranked = rank_products([untagged, tagged], PALETTE, "autumn", None, CONFIG)
    assert ranked[0].product_id == "tagged"
    assert ranked[0].season_match is True
    assert ranked[1].season_match is False


def test_subseason_tag_adds_on_top_of_season() -> None:
    lab = (54.0, 31.0, 39.0)
    with_sub = product("with-sub", lab, seasons=["autumn"], subseasons=["deep-autumn"])
    without_sub = product("without-sub", lab, seasons=["autumn"])
    ranked = rank_products([without_sub, with_sub], PALETTE, "autumn", "deep-autumn", CONFIG)
    assert ranked[0].product_id == "with-sub"
    assert ranked[0].subseason_match is True


def test_out_of_stock_ranks_below_in_stock() -> None:
    lab = (54.0, 31.0, 39.0)
    in_stock = product("in-stock", lab, seasons=["autumn"])
    out_of_stock = product("out-of-stock", lab, seasons=["autumn"], availability="out_of_stock")
    ranked = rank_products([out_of_stock, in_stock], PALETTE, "autumn", None, CONFIG)
    assert ranked[0].product_id == "in-stock"


def test_product_without_colours_gets_zero_proximity() -> None:
    empty = {
        "id": "no-colours",
        "category": "tops",
        "availability": "in_stock",
        "colours": [],
        "season_tags": [{"season_slug": "autumn", "subseason_slug": None}],
    }
    ranked = rank_products([empty], PALETTE, "autumn", None, CONFIG)
    assert ranked[0].palette_proximity == 0.0
    assert ranked[0].min_delta_e is None


def test_distance_beyond_falloff_scores_zero_proximity() -> None:
    very_far = product("far", (95.0, -60.0, -60.0), seasons=["autumn"])
    ranked = rank_products([very_far], PALETTE, "autumn", None, CONFIG)
    assert ranked[0].palette_proximity == 0.0


def test_scores_are_deterministic_and_bounded() -> None:
    items = [
        product("a", (54.0, 31.0, 39.0), seasons=["autumn"], subseasons=["deep-autumn"]),
        product("b", (60.0, -30.0, -40.0), seasons=["summer"]),
        product("c", (50.0, 20.0, 20.0), category="bags", availability="unknown"),
    ]
    first = rank_products(items, PALETTE, "autumn", "deep-autumn", CONFIG)
    second = rank_products(items, PALETTE, "autumn", "deep-autumn", CONFIG)
    assert first == second
    for item in first:
        assert 0.0 <= item.score <= 1.0
