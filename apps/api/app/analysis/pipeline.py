"""Pipeline orchestration.

`run_quality_stage` performs: decode/validate → face detection → face-count
and face-size validation → pose → blur/exposure/lighting/cast → composite
quality report. Later stages (ROIs, colour features, classification) build
on its output.

Structural failures raise AnalysisRejectedError with a stable error code;
gradable problems are reported inside the QualityReportData instead.
"""

from __future__ import annotations

from dataclasses import dataclass

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
from app.analysis.types import DecodedImage, FaceData, QualityReportData
from app.core.classifier import ClassifierConfig
from app.core.errors import AnalysisRejectedError


@dataclass(frozen=True)
class QualityStageResult:
    image: DecodedImage
    face: FaceData
    report: QualityReportData


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
