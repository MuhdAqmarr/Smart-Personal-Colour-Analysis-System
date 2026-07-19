"""Seasonal classification on four dimensions (spec §17–§18).

Dimensions, each normalised to [0, 1]:
- temperature: from the undertone score (0 = coolest, 1 = warmest);
- value: from skin L* (0 = deepest, 1 = lightest);
- chroma: from skin C*ab (0 = most muted, 1 = clearest);
- contrast: ROI L* spread proxy blended with the optional questionnaire.

Season score = 1 − Σ dimensionWeights · |dimension − prototype|; the four
prototype vectors live in the classifier configuration. The margin between
the top two seasons feeds the confidence system. Sub-seasons resolve by
axis rules within the winning season and are only *displayed* when overall
confidence clears `subSeasons.minConfidence`.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from app.analysis.skin_regions.filtering import RegionColourSample


@dataclass(frozen=True)
class SeasonScores:
    dimensions: dict[str, float]  # temperature/value/chroma/contrast ∈ [0,1]
    scores: dict[str, float]  # season slug → score
    season: str
    margin: float  # top-1 − top-2


@dataclass(frozen=True)
class SubSeasonResult:
    sub_season: str | None
    axis: str | None  # which rule fired ("light" / "deep" / "bright" / "soft" / default)


def _unit(value: float, low: float, high: float) -> float:
    if high == low:
        return 0.5
    return float(np.clip((value - low) / (high - low), 0.0, 1.0))


def compute_dimensions(
    combined: RegionColourSample,
    regions: list[RegionColourSample],
    undertone_score: float,
    dimensions_config: dict[str, Any],
    questionnaire: dict[str, Any] | None = None,
) -> dict[str, float]:
    value_cfg = dimensions_config["value"]
    chroma_cfg = dimensions_config["chroma"]
    contrast_cfg = dimensions_config["contrast"]

    temperature = (undertone_score + 1.0) / 2.0
    value = _unit(combined.lab[0], float(value_cfg["scoreLow"]), float(value_cfg["scoreHigh"]))
    chroma = _unit(combined.chroma, float(chroma_cfg["scoreLow"]), float(chroma_cfg["scoreHigh"]))

    # Contrast: weak image proxy (L* spread across usable regions) blended
    # with the questionnaire when present; defaults keep it centred.
    usable = [r for r in regions if r.usable_pixels > 0]
    if len(usable) >= 2:
        l_values = [r.lab[0] for r in usable]
        spread = float(max(l_values) - min(l_values))
        proxy = _unit(
            spread, float(contrast_cfg["roiSpreadLow"]), float(contrast_cfg["roiSpreadHigh"])
        )
    else:
        proxy = float(contrast_cfg["defaultScore"])

    questionnaire_value: float | None = None
    if questionnaire:
        perceived = questionnaire.get("perceivedContrast")
        if perceived == "low":
            questionnaire_value = 0.2
        elif perceived == "medium":
            questionnaire_value = 0.5
        elif perceived == "high":
            questionnaire_value = 0.8

    image_weight = float(contrast_cfg["imageProxyWeight"])
    questionnaire_weight = float(contrast_cfg["questionnaireWeight"])
    if questionnaire_value is None:
        contrast = image_weight * proxy + questionnaire_weight * float(contrast_cfg["defaultScore"])
    else:
        contrast = image_weight * proxy + questionnaire_weight * questionnaire_value

    return {
        "temperature": round(temperature, 4),
        "value": round(value, 4),
        "chroma": round(chroma, 4),
        "contrast": round(float(np.clip(contrast, 0.0, 1.0)), 4),
    }


def classify_season(dimensions: dict[str, float], seasons_config: dict[str, Any]) -> SeasonScores:
    weights = seasons_config["dimensionWeights"]
    prototypes = seasons_config["prototypes"]

    scores: dict[str, float] = {}
    for season, prototype in prototypes.items():
        distance = sum(
            float(weights[dim]) * abs(dimensions[dim] - float(prototype[dim]))
            for dim in ("temperature", "value", "chroma", "contrast")
        )
        scores[season] = round(1.0 - distance, 4)

    ordered = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    season = ordered[0][0]
    margin = round(ordered[0][1] - ordered[1][1], 4)
    return SeasonScores(dimensions=dimensions, scores=scores, season=season, margin=margin)


def classify_sub_season(
    season: str, dimensions: dict[str, float], sub_config: dict[str, Any]
) -> SubSeasonResult:
    """Resolve the sub-season by the first matching axis rule in the
    configured priority order; the season's temperature-true variant is the
    fallback."""
    thresholds = sub_config["axisThresholds"]
    priority: list[str] = list(sub_config["priority"][season])

    light_min = float(thresholds["lightValueMin"])
    deep_max = float(thresholds["deepValueMax"])
    bright_min = float(thresholds["brightChromaMin"])
    soft_max = float(thresholds["softChromaMax"])

    def axis_matches(slug: str) -> str | None:
        axis = slug.split("-")[0]  # light / warm / bright / cool / soft / deep
        if axis == "light":
            return "light" if dimensions["value"] >= light_min else None
        if axis == "deep":
            return "deep" if dimensions["value"] <= deep_max else None
        if axis == "bright":
            return "bright" if dimensions["chroma"] >= bright_min else None
        if axis == "soft":
            return "soft" if dimensions["chroma"] <= soft_max else None
        # warm-*/cool-* are the temperature-true defaults; they always match.
        return "default"

    for slug in priority:
        axis = axis_matches(slug)
        if axis is not None:
            return SubSeasonResult(sub_season=slug, axis=axis)

    return SubSeasonResult(sub_season=priority[-1] if priority else None, axis="default")
