"""Confidence scoring (spec §19).

Classification score and confidence are deliberately separate numbers.
Confidence aggregates configured factors, each normalised to [0, 1]:

- imageQuality — overall quality score / 100;
- roiConsistency — CIEDE2000 agreement between cheeks and cheeks↔forehead;
- usableSkinArea — usable-pixel ratio against the configured "good" level;
- classificationMargin — how decisively the top season beat the runner-up;
- colourCastPenalty — reduced when an environmental cast was measured;
- questionnaireAgreement — neutral (0.5) when absent; 1.0/0.0 when the
  questionnaire supports/contradicts the estimated undertone.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from app.analysis.colour_features.ciede2000 import delta_e_2000_scalar
from app.analysis.skin_regions.filtering import RegionColourSample

ConfidenceLabel = Literal["high", "medium", "low"]


@dataclass(frozen=True)
class ConfidenceResult:
    confidence: float
    label: ConfidenceLabel
    factors: dict[str, float]
    roi_delta_e: dict[str, float]


def _unit(value: float, low: float, high: float) -> float:
    if high == low:
        return 1.0
    return float(np.clip((value - low) / (high - low), 0.0, 1.0))


def _questionnaire_agreement(questionnaire: dict[str, Any] | None, undertone_score: float) -> float:
    if not questionnaire:
        return 0.5
    jewellery = questionnaire.get("jewelleryPreference")
    if jewellery not in ("gold", "silver"):
        return 0.5
    leaning_warm = undertone_score >= 0
    supports = (jewellery == "gold") == leaning_warm
    return 1.0 if supports else 0.0


def compute_confidence(
    *,
    quality_score: float,
    regions: dict[str, RegionColourSample],
    usable_skin_ratio: float,
    classification_margin: float,
    cast_magnitude: float,
    cast_max: float,
    undertone_score: float,
    questionnaire: dict[str, Any] | None,
    config: dict[str, Any],
    skin_area_good: float,
) -> ConfidenceResult:
    weights = config["factorWeights"]
    roi_cfg = config["roiConsistency"]
    margin_cfg = config["classificationMargin"]
    labels_cfg = config["labels"]

    # --- ROI consistency (CIEDE2000 agreement between regions) ----------
    deltas: dict[str, float] = {}
    left = regions.get("left_cheek")
    right = regions.get("right_cheek")
    forehead = regions.get("forehead")
    if left and right and left.usable_pixels and right.usable_pixels:
        deltas["cheeks"] = delta_e_2000_scalar(left.lab, right.lab)
    if forehead and forehead.usable_pixels:
        cheek_labs = [r.lab for r in (left, right) if r and r.usable_pixels]
        if cheek_labs:
            mean_cheek = tuple(float(np.mean([lab[i] for lab in cheek_labs])) for i in range(3))
            deltas["forehead_cheeks"] = delta_e_2000_scalar(
                forehead.lab, (mean_cheek[0], mean_cheek[1], mean_cheek[2])
            )

    good = float(roi_cfg["deltaEGood"])
    poor = float(roi_cfg["deltaEPoor"])
    if deltas:
        worst = max(deltas.values())
        roi_consistency = 1.0 - _unit(worst, good, poor)
    else:
        roi_consistency = 0.0  # nothing to corroborate against

    factors = {
        "imageQuality": float(np.clip(quality_score / 100.0, 0.0, 1.0)),
        "roiConsistency": roi_consistency,
        "usableSkinArea": _unit(usable_skin_ratio, 0.0, skin_area_good),
        "classificationMargin": _unit(
            classification_margin, float(margin_cfg["marginPoor"]), float(margin_cfg["marginGood"])
        ),
        "colourCastPenalty": 1.0 - _unit(cast_magnitude, 0.0, cast_max),
        "questionnaireAgreement": _questionnaire_agreement(questionnaire, undertone_score),
    }

    confidence = float(sum(float(weights[name]) * factors[name] for name in factors))
    confidence = float(np.clip(confidence, 0.0, 1.0))

    label: ConfidenceLabel
    if confidence >= float(labels_cfg["highMin"]):
        label = "high"
    elif confidence >= float(labels_cfg["mediumMin"]):
        label = "medium"
    else:
        label = "low"

    return ConfidenceResult(
        confidence=round(confidence, 4),
        label=label,
        factors={k: round(v, 4) for k, v in factors.items()},
        roi_delta_e={k: round(v, 2) for k, v in deltas.items()},
    )
