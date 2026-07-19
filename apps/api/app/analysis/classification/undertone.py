"""Undertone estimation (spec §16).

Deterministic, config-driven scoring. Signals, each mapped to [-1, +1]
(negative = cool, positive = warm):

- hue angle hab of the combined skin colour — skin hue angles sit roughly
  between 30° and 75°; higher (more yellow) reads warm, lower (more red/
  pink) reads cool;
- absolute b* level — yellowness directly;
- region agreement — mean of the per-region hue votes, rewarding
  consistent evidence across forehead and both cheeks.

The weighted sum is the undertone score. Public output is warm/cool;
internally `neutral` (|score| within the neutral band) and `uncertain`
(low image quality) are tracked and surfaced through confidence/wording.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from app.analysis.skin_regions.filtering import RegionColourSample

InternalUndertone = Literal["warm", "cool", "neutral", "uncertain"]


@dataclass(frozen=True)
class UndertoneResult:
    undertone: Literal["warm", "cool"]
    internal: InternalUndertone
    score: float  # [-1, +1], warm positive
    signals: dict[str, float]


def _band_score(value: float, cool_max: float, warm_min: float) -> float:
    """Map value to [-1, +1]: ≤cool_max → -1, ≥warm_min → +1, linear inside."""
    if value <= cool_max:
        return -1.0
    if value >= warm_min:
        return 1.0
    span = warm_min - cool_max
    return float(2.0 * (value - cool_max) / span - 1.0)


def _questionnaire_signal(questionnaire: dict[str, Any] | None) -> float:
    """Optional supporting signal in [-1, +1] from self-reported answers."""
    if not questionnaire:
        return 0.0
    votes: list[float] = []
    jewellery = questionnaire.get("jewelleryPreference")
    if jewellery == "gold":
        votes.append(1.0)
    elif jewellery == "silver":
        votes.append(-1.0)
    elif jewellery == "both":
        votes.append(0.0)
    sun = questionnaire.get("sunReaction")
    if sun == "burns-easily":
        votes.append(-0.6)
    elif sun == "tans-easily":
        votes.append(0.6)
    elif sun == "rarely-burns":
        votes.append(0.4)
    elif sun == "burns-then-tans":
        votes.append(-0.2)
    return float(np.mean(votes)) if votes else 0.0


def classify_undertone(
    combined: RegionColourSample,
    regions: list[RegionColourSample],
    quality_score: float,
    config: dict[str, Any],
    questionnaire: dict[str, Any] | None = None,
) -> UndertoneResult:
    hue_cfg = config["hueAngleDegrees"]
    b_cfg = config["bStar"]
    weights = config["signalWeights"]

    hue_signal = _band_score(
        combined.hue_angle_degrees, float(hue_cfg["coolMax"]), float(hue_cfg["warmMin"])
    )
    b_signal = _band_score(combined.lab[2], float(b_cfg["coolMax"]), float(b_cfg["warmMin"]))

    usable = [r for r in regions if r.usable_pixels > 0]
    if usable:
        region_votes = [
            _band_score(r.hue_angle_degrees, float(hue_cfg["coolMax"]), float(hue_cfg["warmMin"]))
            for r in usable
        ]
        agreement_signal = float(np.mean(region_votes))
    else:
        agreement_signal = 0.0

    score = (
        float(weights["hueAngle"]) * hue_signal
        + float(weights["bStar"]) * b_signal
        + float(weights["regionAgreement"]) * agreement_signal
    )
    score += float(config["questionnaireWeight"]) * _questionnaire_signal(questionnaire)
    score = float(np.clip(score, -1.0, 1.0))

    neutral_band = float(config["neutralBandWidth"])
    uncertain_below = float(config["uncertainQualityBelow"])

    internal: InternalUndertone
    if quality_score < uncertain_below:
        internal = "uncertain"
    elif abs(score) <= neutral_band:
        internal = "neutral"
    else:
        internal = "warm" if score > 0 else "cool"

    public: Literal["warm", "cool"] = "warm" if score >= 0 else "cool"

    return UndertoneResult(
        undertone=public,
        internal=internal,
        score=round(score, 4),
        signals={
            "hueAngle": round(hue_signal, 4),
            "bStar": round(b_signal, 4),
            "regionAgreement": round(agreement_signal, 4),
        },
    )
