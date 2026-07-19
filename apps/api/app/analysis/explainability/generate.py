"""Plain-language explanations for every analysis result (spec §20).

Text is generated from the measured signals — never invented. Wording is
deliberately hedged ("estimated", "suggests", "leans") because the engine
is a rule-based styling aid, not ground truth.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.analysis.classification.seasons import SeasonScores, SubSeasonResult
from app.analysis.classification.undertone import UndertoneResult
from app.analysis.confidence.scoring import ConfidenceResult
from app.analysis.skin_regions.filtering import RegionColourSample
from app.analysis.types import QualityReportData

SEASON_NAMES = {"spring": "Spring", "summer": "Summer", "autumn": "Autumn", "winter": "Winter"}


@dataclass(frozen=True)
class Explanation:
    summary: str
    evidence: list[str]
    quality_notes: list[str]
    improvement_tips: list[str]
    warnings: list[str]


def _sub_season_name(slug: str | None) -> str | None:
    if not slug:
        return None
    return " ".join(part.capitalize() for part in slug.split("-"))


def build_explanation(
    *,
    undertone: UndertoneResult,
    seasons: SeasonScores,
    sub_season: SubSeasonResult,
    show_sub_season: bool,
    confidence: ConfidenceResult,
    combined: RegionColourSample,
    quality: QualityReportData,
) -> Explanation:
    evidence: list[str] = []
    warnings: list[str] = []

    # --- Undertone evidence ------------------------------------------------
    hue = combined.hue_angle_degrees
    if undertone.signals["hueAngle"] > 0.3:
        evidence.append(
            f"The extracted skin hue angle ({hue:.0f}°) sits toward the warmer, golden range."
        )
    elif undertone.signals["hueAngle"] < -0.3:
        evidence.append(
            f"The extracted skin hue angle ({hue:.0f}°) sits toward the cooler, rosier range."
        )
    else:
        evidence.append(
            f"The extracted skin hue angle ({hue:.0f}°) sits between the typical "
            "warm and cool ranges."
        )

    b_star = combined.lab[2]
    if undertone.signals["bStar"] > 0.3:
        evidence.append(f"Yellowness in the skin sample is elevated (b* = {b_star:.1f}).")
    elif undertone.signals["bStar"] < -0.3:
        evidence.append(f"Yellowness in the skin sample is low (b* = {b_star:.1f}).")

    if undertone.signals["regionAgreement"] > 0.3 or undertone.signals["regionAgreement"] < -0.3:
        evidence.append("The forehead and both cheeks produced consistent colour readings.")
    elif "cheeks" in confidence.roi_delta_e and confidence.roi_delta_e["cheeks"] > 8:
        warnings.append(
            "The left and right cheeks disagree noticeably — uneven lighting may be "
            "influencing the estimate."
        )

    # --- Season evidence ------------------------------------------------------
    dims = seasons.dimensions
    value_text = "light" if dims["value"] >= 0.62 else "deep" if dims["value"] <= 0.38 else "medium"
    chroma_text = (
        "clear" if dims["chroma"] >= 0.62 else "muted" if dims["chroma"] <= 0.38 else "balanced"
    )
    evidence.append(
        f"Overall depth reads as {value_text} (L* = {combined.lab[0]:.1f}) with "
        f"{chroma_text} colour intensity (chroma = {combined.chroma:.1f})."
    )
    runner_up = sorted(seasons.scores.items(), key=lambda item: item[1], reverse=True)[1]
    if seasons.margin < 0.04:
        warnings.append(
            f"{SEASON_NAMES[seasons.season]} won only narrowly over "
            f"{SEASON_NAMES[runner_up[0]]} — treat neighbouring palettes as worth exploring."
        )
    else:
        evidence.append(
            f"{SEASON_NAMES[seasons.season]} scored clearly ahead of "
            f"{SEASON_NAMES[runner_up[0]]} on the four styling dimensions."
        )

    if undertone.internal == "neutral":
        warnings.append(
            "The undertone signals are close to neutral; colours from the border of the "
            "neighbouring temperature can also work well."
        )
    if undertone.internal == "uncertain":
        warnings.append("Image quality limited how confidently the undertone could be estimated.")

    # --- Quality notes / tips ----------------------------------------------------
    quality_notes = [issue.message for issue in quality.issues]
    tips = list(quality.retake_tips)
    if confidence.label != "high":
        tips.append(
            "For a more confident result, retake in soft natural daylight with a plain "
            "background and no makeup or filters."
        )
    if not quality_notes:
        quality_notes.append(
            f"Image quality was good (score {quality.overall_score:.0f}/100), so the colour "
            "measurements are trustworthy within the stated limitations."
        )

    # --- Summary ---------------------------------------------------------------------
    season_name = SEASON_NAMES[seasons.season]
    sub_name = _sub_season_name(sub_season.sub_season) if show_sub_season else None
    tone_word = "warm" if undertone.undertone == "warm" else "cool"
    headline = sub_name or season_name
    summary = (
        f"Your skin sample leans {tone_word}, and its combination of depth and colour "
        f"intensity matches the {headline} palette most closely "
        f"({confidence.label} confidence, {confidence.confidence:.0%})."
    )
    if sub_name is None and sub_season.sub_season:
        summary += (
            f" A more specific match ({_sub_season_name(sub_season.sub_season)}) was "
            "identified but is shown only as a suggestion because confidence is limited."
        )

    return Explanation(
        summary=summary,
        evidence=evidence,
        quality_notes=quality_notes,
        improvement_tips=tips,
        warnings=warnings,
    )
