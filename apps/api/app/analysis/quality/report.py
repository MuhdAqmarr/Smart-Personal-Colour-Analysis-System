"""Composite quality report: component scores, issues, and retake tips.

Every component is scored 0–100; the overall score is the weighted sum
using `quality.componentWeights` from the classifier configuration.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from app.analysis.types import (
    CastMetrics,
    ExposureMetrics,
    LightingMetrics,
    PoseAngles,
    QualityIssue,
    QualityReportData,
)


def _linear_score(value: float, poor: float, good: float) -> float:
    """Map value∈[poor, good] → [0, 100], clamped, monotone increasing."""
    if good == poor:
        return 100.0
    position = (value - poor) / (good - poor)
    return float(np.clip(position, 0.0, 1.0) * 100.0)


def _inverse_score(value: float, good: float, poor: float) -> float:
    """100 when value ≤ good, 0 when value ≥ poor, linear in between."""
    if poor == good:
        return 100.0
    position = (value - good) / (poor - good)
    return float((1.0 - np.clip(position, 0.0, 1.0)) * 100.0)


def build_quality_report(
    *,
    config: dict[str, Any],
    face_detected: bool,
    face_width_ratio: float,
    pose: PoseAngles,
    blur_variance: float,
    exposure: ExposureMetrics,
    lighting: LightingMetrics,
    cast: CastMetrics,
    usable_skin_ratio: float | None,
) -> QualityReportData:
    """Assemble the 0–100 quality report from measured metrics.

    `config` is the `quality` section of the classifier configuration.
    `usable_skin_ratio` is None until the ROI stage has run (preview mode);
    the component then scores from face size as a conservative proxy.
    """
    weights = config["componentWeights"]
    face_size_cfg = config["faceSize"]
    pose_cfg = config["pose"]
    blur_cfg = config["blur"]
    exposure_cfg = config["exposure"]
    lighting_cfg = config["lighting"]
    cast_cfg = config["colourCast"]
    skin_cfg = config["skinArea"]

    issues: list[QualityIssue] = []
    tips: list[str] = []

    # --- Face detection ---------------------------------------------------
    face_detection_score = 100.0 if face_detected else 0.0

    # --- Face size ----------------------------------------------------------
    face_size_score = _linear_score(
        face_width_ratio,
        face_size_cfg["minFaceWidthRatio"] * 0.5,
        face_size_cfg["goodFaceWidthRatio"],
    )
    if face_width_ratio < face_size_cfg["minFaceWidthRatio"]:
        issues.append(
            QualityIssue(
                code="FACE_TOO_SMALL",
                message="Your face occupies too little of the frame for reliable sampling.",
                severity="blocking",
            )
        )
        tips.append("Move closer to the camera so your face fills the guide.")

    # --- Pose ---------------------------------------------------------------
    yaw, pitch, roll = (
        abs(pose.yaw_degrees),
        abs(pose.pitch_degrees),
        abs(pose.roll_degrees),
    )
    pose_score = min(
        _inverse_score(yaw, pose_cfg["warnYawDegrees"], pose_cfg["maxYawDegrees"]),
        _inverse_score(pitch, pose_cfg["warnPitchDegrees"], pose_cfg["maxPitchDegrees"]),
        _inverse_score(roll, pose_cfg["warnRollDegrees"], pose_cfg["maxRollDegrees"]),
    )
    if yaw > pose_cfg["maxYawDegrees"] or pitch > pose_cfg["maxPitchDegrees"]:
        issues.append(
            QualityIssue(
                code="POSE_TOO_EXTREME",
                message="Your head is turned or tilted too far away from the camera.",
                severity="blocking",
            )
        )
        tips.append("Face the camera directly with your eyes level.")
    elif roll > pose_cfg["maxRollDegrees"]:
        issues.append(
            QualityIssue(
                code="POSE_TOO_EXTREME",
                message="The photo is too tilted for reliable region placement.",
                severity="blocking",
            )
        )
        tips.append("Keep the camera level so your face is upright in the frame.")
    elif pose_score < 100.0:
        issues.append(
            QualityIssue(
                code="POSE_SLIGHTLY_OFF",
                message="A slight head turn or tilt was detected.",
                severity="warning",
            )
        )

    # --- Sharpness ------------------------------------------------------------
    sharpness_score = _linear_score(
        blur_variance, blur_cfg["minLaplacianVariance"] * 0.4, blur_cfg["goodLaplacianVariance"]
    )
    if blur_variance < blur_cfg["minLaplacianVariance"]:
        issues.append(
            QualityIssue(
                code="IMAGE_TOO_BLURRY",
                message="The photo is too blurry for reliable colour sampling.",
                severity="blocking",
            )
        )
        tips.append("Hold the camera steady and make sure your face is in focus.")

    # --- Exposure ---------------------------------------------------------------
    ideal_min = exposure_cfg["idealMeanLumaMin"]
    ideal_max = exposure_cfg["idealMeanLumaMax"]
    if exposure.mean_luma < ideal_min:
        exposure_score = _linear_score(
            exposure.mean_luma, exposure_cfg["minMeanLuma"] * 0.5, ideal_min
        )
    elif exposure.mean_luma > ideal_max:
        exposure_score = _inverse_score(exposure.mean_luma, ideal_max, 255.0)
    else:
        exposure_score = 100.0
    # Clipping penalties apply within the band too.
    exposure_score = min(
        exposure_score,
        _inverse_score(
            exposure.highlight_clip_ratio, 0.0, exposure_cfg["maxHighlightClipRatio"] * 2
        ),
        _inverse_score(exposure.dark_pixel_ratio, 0.0, exposure_cfg["maxDarkPixelRatio"] * 2),
    )

    if exposure.status == "too_dark":
        issues.append(
            QualityIssue(
                code="IMAGE_TOO_DARK",
                message="The image is too dark for a reliable colour analysis.",
                severity="blocking",
            )
        )
        tips.append("Face a window or add soft, neutral light in front of you.")
    elif exposure.status == "too_bright":
        issues.append(
            QualityIssue(
                code="IMAGE_TOO_BRIGHT",
                message="The image is overexposed, which washes out skin colour.",
                severity="blocking",
            )
        )
        tips.append("Step away from direct light so highlights are not blown out.")
    elif exposure.status == "strong_shadow":
        issues.append(
            QualityIssue(
                code="STRONG_SHADOW",
                message="Deep shadows cover part of your face.",
                severity="warning",
            )
        )
        tips.append("Turn to face the light source so both cheeks are evenly lit.")
    elif exposure.status == "low_contrast":
        issues.append(
            QualityIssue(
                code="LOW_CONTRAST",
                message="The image has very low contrast.",
                severity="warning",
            )
        )

    # --- Lighting consistency -------------------------------------------------
    lighting_score = _inverse_score(
        lighting.left_right_luma_delta,
        lighting_cfg["warnLeftRightLumaDelta"],
        lighting_cfg["maxLeftRightLumaDelta"],
    )
    if lighting.left_right_luma_delta > lighting_cfg["maxLeftRightLumaDelta"]:
        issues.append(
            QualityIssue(
                code="UNEVEN_LIGHTING",
                message="One side of your face is much brighter than the other.",
                severity="blocking",
            )
        )
        tips.append("Face the light source directly rather than side-on.")
    elif lighting.left_right_luma_delta > lighting_cfg["warnLeftRightLumaDelta"]:
        issues.append(
            QualityIssue(
                code="UNEVEN_LIGHTING",
                message="Lighting across your face is noticeably uneven.",
                severity="warning",
            )
        )

    # --- Colour cast ------------------------------------------------------------
    cast_score = _inverse_score(cast.magnitude, cast_cfg["warnAbShift"], cast_cfg["maxAbShift"])
    if cast.magnitude > cast_cfg["maxAbShift"]:
        issues.append(
            QualityIssue(
                code="STRONG_COLOUR_CAST",
                message=(
                    f"A strong {cast.direction} colour cast was detected, which skews skin tones."
                ),
                severity="blocking",
            )
        )
        tips.append("Use neutral daylight and avoid coloured or warm-white bulbs.")
    elif cast.direction != "none":
        issues.append(
            QualityIssue(
                code="COLOUR_CAST",
                message=f"A mild {cast.direction} colour cast was detected.",
                severity="warning",
            )
        )
        tips.append("Daylight from a window gives the most neutral colours.")

    # --- Usable skin area ---------------------------------------------------------
    if usable_skin_ratio is None:
        # Preview mode: ROI filtering has not run; use a conservative proxy
        # derived from face size (bigger face ⇒ more usable pixels).
        skin_score = min(face_size_score, 90.0)
    else:
        skin_score = _linear_score(
            usable_skin_ratio,
            skin_cfg["minUsablePixelRatio"] * 0.5,
            skin_cfg["goodUsablePixelRatio"],
        )
        if usable_skin_ratio < skin_cfg["minUsablePixelRatio"]:
            issues.append(
                QualityIssue(
                    code="LOW_USABLE_SKIN_AREA",
                    message="Too little clean skin area was found on the forehead and cheeks.",
                    severity="warning",
                )
            )
            tips.append("Clear hair from your forehead and remove glasses before retaking.")

    components = {
        "faceDetection": round(face_detection_score, 2),
        "faceSize": round(face_size_score, 2),
        "pose": round(pose_score, 2),
        "sharpness": round(sharpness_score, 2),
        "exposure": round(exposure_score, 2),
        "lightingConsistency": round(lighting_score, 2),
        "colourCast": round(cast_score, 2),
        "usableSkinArea": round(skin_score, 2),
    }
    overall = round(sum(components[key] * weights[key] for key in components), 2)

    has_blocking = any(issue.severity == "blocking" for issue in issues)
    acceptable = overall >= config["minOverallScore"] and not has_blocking
    if not acceptable and not tips:
        tips.append("Retake the photo in soft, even daylight, facing the camera directly.")

    return QualityReportData(
        overall_score=overall,
        acceptable=acceptable,
        components=components,
        exposure=exposure,
        cast=cast,
        pose=pose,
        lighting=lighting,
        blur_variance=blur_variance,
        face_width_ratio=face_width_ratio,
        issues=issues,
        retake_tips=tips,
    )
