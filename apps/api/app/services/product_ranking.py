"""Product recommendation ranking (documented formula, spec §23.1).

score = w_palette   · paletteProximity
      + w_season    · seasonTagMatch
      + w_subseason · subSeasonTagMatch
      + w_category  · categoryRelevance
      + w_avail     · availability

- paletteProximity = max(0, 1 − minΔE00 / deltaE00Falloff), where minΔE00
  is the smallest CIEDE2000 distance between the product's colours and the
  user's recommended palette colours (the cautious group is excluded).
- seasonTagMatch / subSeasonTagMatch ∈ {0, 1}.
- categoryRelevance: 1.0 for garments and headwear worn near the face,
  0.8 for other garments/accessories, 0.6 for shoes/bags, 0.7 cosmetics —
  a documented editorial weighting, not a claim of science.
- availability: in_stock 1.0, unknown 0.5, out_of_stock 0.0.

Weights and the falloff live in classifier config (`productMatching`).
Product photography may not represent real-world colour; the UI states it.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from app.analysis.colour_features.ciede2000 import delta_e_2000

CATEGORY_RELEVANCE: dict[str, float] = {
    "tops": 1.0,
    "shirts": 1.0,
    "dresses": 1.0,
    "scarves": 1.0,
    "hijabs": 1.0,
    "outerwear": 0.8,
    "trousers": 0.8,
    "skirts": 0.8,
    "accessories": 0.8,
    "cosmetics": 0.7,
    "shoes": 0.6,
    "bags": 0.6,
}

AVAILABILITY_SCORE: dict[str, float] = {
    "in_stock": 1.0,
    "unknown": 0.5,
    "out_of_stock": 0.0,
}


@dataclass(frozen=True)
class RankedProduct:
    product_id: str
    score: float
    min_delta_e: float | None
    palette_proximity: float
    season_match: bool
    subseason_match: bool


def rank_products(
    products: list[dict[str, Any]],
    palette_labs: np.ndarray,
    season_slug: str,
    subseason_slug: str | None,
    config: dict[str, Any],
) -> list[RankedProduct]:
    """Score and sort products for one analysis.

    `products` rows need: id, category, availability, colours (list of
    {lab_l, lab_a, lab_b}), season_tags (list of {season_slug,
    subseason_slug}).
    `palette_labs` is an (N, 3) array of recommended palette colours.
    """
    weights = config["weights"]
    falloff = float(config["deltaE00Falloff"])

    ranked: list[RankedProduct] = []
    for product in products:
        colours = product.get("colours") or []
        min_delta: float | None = None
        if colours and palette_labs.size:
            product_labs = np.array(
                [[c["lab_l"], c["lab_a"], c["lab_b"]] for c in colours], dtype=np.float64
            )
            # All pairwise distances product-colour × palette-colour.
            distances = delta_e_2000(product_labs[:, None, :], palette_labs[None, :, :])
            min_delta = float(np.min(distances))
        proximity = max(0.0, 1.0 - (min_delta / falloff)) if min_delta is not None else 0.0

        tags = product.get("season_tags") or []
        season_match = any(tag["season_slug"] == season_slug for tag in tags)
        subseason_match = bool(subseason_slug) and any(
            tag.get("subseason_slug") == subseason_slug for tag in tags
        )

        category_relevance = CATEGORY_RELEVANCE.get(str(product.get("category")), 0.7)
        availability = AVAILABILITY_SCORE.get(str(product.get("availability")), 0.5)

        score = (
            float(weights["paletteDistance"]) * proximity
            + float(weights["seasonTag"]) * (1.0 if season_match else 0.0)
            + float(weights["subSeasonTag"]) * (1.0 if subseason_match else 0.0)
            + float(weights["categoryRelevance"]) * category_relevance
            + float(weights["availability"]) * availability
        )
        ranked.append(
            RankedProduct(
                product_id=str(product["id"]),
                score=round(score, 4),
                min_delta_e=round(min_delta, 2) if min_delta is not None else None,
                palette_proximity=round(proximity, 4),
                season_match=season_match,
                subseason_match=subseason_match,
            )
        )

    ranked.sort(key=lambda item: item.score, reverse=True)
    return ranked
