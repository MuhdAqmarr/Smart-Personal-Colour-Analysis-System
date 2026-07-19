"""Pipeline orchestration.

`run_quality_stage`: decode/validate → face detection → face-count and
face-size validation → pose → blur/exposure/lighting/cast → composite
quality report.

`run_full_analysis`: quality stage → skin ROIs → pixel filtering and
robust aggregation → colour features → undertone → season/sub-season →
confidence → explainability. Deterministic end to end.

Structural failures raise AnalysisRejectedError with a stable error code;
gradable problems are reported inside the QualityReportData instead.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, cast

from app.analysis.classification.seasons import (
    SeasonScores,
    SubSeasonResult,
    classify_season,
    classify_sub_season,
    compute_dimensions,
)
from app.analysis.classification.undertone import UndertoneResult, classify_undertone
from app.analysis.confidence.scoring import ConfidenceResult, compute_confidence
from app.analysis.explainability.generate import Explanation, build_explanation
from app.analysis.face_detection.detector import detect_faces
from app.analysis.landmarks.geometry import extract_pose
from app.analysis.preprocessing.validation import UploadLimits, validate_and_decode
from app.analysis.quality.metrics import (
    blur_variance_of_laplacian,
    estimate_colour_cast,
    exposure_metrics,
    lighting_consistency,
)
from app.analysis.quality.report import build_quality_report
from app.analysis.skin_regions.filtering import (
    RegionColourSample,
    combined_sample,
    filter_and_aggregate,
)
from app.analysis.skin_regions.rois import build_rois
from app.analysis.types import DecodedImage, FaceData, QualityReportData
from app.core.classifier import ClassifierConfig
from app.core.errors import AnalysisRejectedError


@dataclass(frozen=True)
class QualityStageResult:
    image: DecodedImage
    face: FaceData
    report: QualityReportData


@dataclass(frozen=True)
class FullAnalysisResult:
    image: DecodedImage
    face: FaceData
    quality: QualityReportData
    samples: list[RegionColourSample]  # forehead, left_cheek, right_cheek, combined
    combined: RegionColourSample
    undertone: UndertoneResult
    seasons: SeasonScores
    sub_season: SubSeasonResult
    show_sub_season: bool
    confidence: ConfidenceResult
    explanation: Explanation
    classifier_version: str
    processing_ms: int


def limits_from_config(config: ClassifierConfig, max_upload_bytes: int) -> UploadLimits:
    image_cfg = config.image
    return UploadLimits(
        max_bytes=max_upload_bytes,
        max_decoded_pixels=image_cfg.maxDecodedPixels,
        min_edge_pixels=image_cfg.minEdgePixels,
        max_analysis_edge_pixels=image_cfg.maxAnalysisEdgePixels,
        allowed_formats=tuple(image_cfg.allowedFormats),
    )


def run_quality_stage(
    data: bytes,
    *,
    declared_mime: str | None,
    filename: str | None,
    config: ClassifierConfig,
    max_upload_bytes: int,
) -> QualityStageResult:
    image = validate_and_decode(
        data,
        declared_mime=declared_mime,
        filename=filename,
        limits=limits_from_config(config, max_upload_bytes),
    )

    faces = detect_faces(image.rgb)
    if len(faces) == 0:
        raise AnalysisRejectedError(
            "No face was detected. Make sure your face is clearly visible and well lit.",
            code="NO_FACE_DETECTED",
        )
    if len(faces) > 1:
        raise AnalysisRejectedError(
            f"{len(faces)} faces were detected — the analysis needs exactly one person.",
            code="MULTIPLE_FACES_DETECTED",
            details={"faceCount": len(faces)},
        )
    face = faces[0]

    quality_cfg = config.quality
    quality_dict = quality_cfg.model_dump()

    # Face partially outside the frame?
    x0, y0, x1, y1 = face.bbox
    margin = 1.0
    if x0 < -margin or y0 < -margin or x1 > image.width + margin or y1 > image.height + margin:
        raise AnalysisRejectedError(
            "Part of your face is outside the frame. Centre your face and retake.",
            code="FACE_OUT_OF_FRAME",
        )

    face_width_ratio = face.bbox_width / image.width
    if face_width_ratio < quality_dict["faceSize"]["minFaceWidthRatio"]:
        raise AnalysisRejectedError(
            "Your face is too small in the frame. Move closer to the camera and retake.",
            code="FACE_TOO_SMALL",
            details={"faceWidthRatio": round(face_width_ratio, 4)},
        )

    pose = extract_pose(face)
    pose_cfg = quality_dict["pose"]
    if (
        abs(pose.yaw_degrees) > pose_cfg["maxYawDegrees"]
        or abs(pose.pitch_degrees) > pose_cfg["maxPitchDegrees"]
        or abs(pose.roll_degrees) > pose_cfg["maxRollDegrees"]
    ):
        raise AnalysisRejectedError(
            "Your head is turned or tilted too far for a reliable analysis. "
            "Face the camera directly and retake.",
            code="POSE_TOO_EXTREME",
            details={
                "yawDegrees": round(pose.yaw_degrees, 1),
                "pitchDegrees": round(pose.pitch_degrees, 1),
                "rollDegrees": round(pose.roll_degrees, 1),
            },
        )

    blur = blur_variance_of_laplacian(
        image.rgb, face.bbox, analysis_width=quality_dict["blur"]["faceCropAnalysisWidth"]
    )
    exposure_cfg = quality_dict["exposure"]
    exposure = exposure_metrics(
        image.rgb,
        face.bbox,
        dark_pixel_threshold=exposure_cfg["darkPixelThreshold"],
        highlight_clip_threshold=exposure_cfg["highlightClipThreshold"],
        shadow_clip_threshold=exposure_cfg["shadowClipThreshold"],
        min_mean_luma=exposure_cfg["minMeanLuma"],
        max_mean_luma=exposure_cfg["maxMeanLuma"],
        max_dark_pixel_ratio=exposure_cfg["maxDarkPixelRatio"],
        max_highlight_clip_ratio=exposure_cfg["maxHighlightClipRatio"],
        max_shadow_clip_ratio=exposure_cfg["maxShadowClipRatio"],
        min_local_contrast=exposure_cfg["minLocalContrast"],
        max_left_right_delta_for_status=quality_dict["lighting"]["maxLeftRightLumaDelta"],
    )
    lighting = lighting_consistency(image.rgb, face.bbox)
    cast_cfg = quality_dict["colourCast"]
    cast = estimate_colour_cast(
        image.rgb,
        face.bbox,
        gray_world_weight=cast_cfg["grayWorldWeight"],
        face_consistency_weight=cast_cfg["faceConsistencyWeight"],
        warn_ab_shift=cast_cfg["warnAbShift"],
    )

    report = build_quality_report(
        config=quality_dict,
        face_detected=True,
        face_width_ratio=face_width_ratio,
        pose=pose,
        blur_variance=blur,
        exposure=exposure,
        lighting=lighting,
        cast=cast,
        usable_skin_ratio=None,
    )
    return QualityStageResult(image=image, face=face, report=report)


def run_full_analysis(
    data: bytes,
    *,
    declared_mime: str | None,
    filename: str | None,
    config: ClassifierConfig,
    max_upload_bytes: int,
    questionnaire: dict[str, Any] | None = None,
    allow_low_quality: bool = False,
) -> FullAnalysisResult:
    """Complete deterministic analysis of one facial image."""
    started = time.perf_counter()

    stage = run_quality_stage(
        data,
        declared_mime=declared_mime,
        filename=filename,
        config=config,
        max_upload_bytes=max_upload_bytes,
    )
    image, face = stage.image, stage.face
    quality_dict = config.quality.model_dump()
    roi_config = dict(config.roi)

    # --- Skin regions ------------------------------------------------------
    rois = build_rois(face, (image.height, image.width), roi_config)
    filter_config = cast(dict[str, Any], roi_config["pixelFilter"])
    region_samples = [
        filter_and_aggregate(image.rgb, roi.mask, roi.name, filter_config) for roi in rois
    ]
    combined = combined_sample(region_samples)

    min_pixels = int(quality_dict["skinArea"]["minUsablePixelsPerRoi"])
    usable_regions = [s for s in region_samples if s.usable_pixels >= min_pixels]
    if not usable_regions or combined.usable_pixels == 0:
        raise AnalysisRejectedError(
            "Too little clean skin was visible on the forehead and cheeks. "
            "Clear hair from your face, remove glasses, and retake in even light.",
            code="LOW_USABLE_SKIN_AREA",
        )

    usable_ratio = sum(s.usable_pixels for s in region_samples) / max(
        sum(s.total_pixels for s in region_samples), 1
    )

    # Rebuild the quality report with the measured usable-skin component.
    quality = build_quality_report(
        config=quality_dict,
        face_detected=True,
        face_width_ratio=stage.report.face_width_ratio,
        pose=stage.report.pose,
        blur_variance=stage.report.blur_variance,
        exposure=stage.report.exposure,
        lighting=stage.report.lighting,
        cast=stage.report.cast,
        usable_skin_ratio=usable_ratio,
    )

    if not quality.acceptable and not allow_low_quality:
        raise AnalysisRejectedError(
            "The image quality is too low for a reliable colour analysis.",
            code="QUALITY_TOO_LOW",
            details={
                "overallScore": quality.overall_score,
                "issues": [
                    {"code": i.code, "message": i.message, "severity": i.severity}
                    for i in quality.issues
                ],
                "retakeTips": quality.retake_tips,
            },
        )

    # --- Classification -------------------------------------------------------
    undertone = classify_undertone(
        combined,
        region_samples,
        quality.overall_score,
        dict(config.undertone),
        questionnaire,
    )
    dimensions = compute_dimensions(
        combined,
        region_samples,
        undertone.score,
        dict(config.dimensions),
        questionnaire,
    )
    seasons = classify_season(dimensions, config.seasons.model_dump())
    sub_cfg = dict(config.subSeasons)
    sub_season = classify_sub_season(seasons.season, dimensions, sub_cfg)

    confidence = compute_confidence(
        quality_score=quality.overall_score,
        regions={s.region: s for s in region_samples},
        usable_skin_ratio=usable_ratio,
        classification_margin=seasons.margin,
        cast_magnitude=quality.cast.magnitude,
        cast_max=float(quality_dict["colourCast"]["maxAbShift"]),
        undertone_score=undertone.score,
        questionnaire=questionnaire,
        config=config.confidence.model_dump(),
        skin_area_good=float(quality_dict["skinArea"]["goodUsablePixelRatio"]),
    )
    show_sub_season = confidence.confidence >= float(cast(float, sub_cfg["minConfidence"]))

    explanation = build_explanation(
        undertone=undertone,
        seasons=seasons,
        sub_season=sub_season,
        show_sub_season=show_sub_season,
        confidence=confidence,
        combined=combined,
        quality=quality,
    )

    processing_ms = int((time.perf_counter() - started) * 1000)
    return FullAnalysisResult(
        image=image,
        face=face,
        quality=quality,
        samples=[*region_samples, combined],
        combined=combined,
        undertone=undertone,
        seasons=seasons,
        sub_season=sub_season,
        show_sub_season=show_sub_season,
        confidence=confidence,
        explanation=explanation,
        classifier_version=config.version,
        processing_ms=processing_ms,
    )
