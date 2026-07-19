"""Shared datatypes for the analysis pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

import numpy as np

ExposureStatus = Literal[
    "acceptable", "too_dark", "too_bright", "strong_shadow", "uneven_lighting", "low_contrast"
]
CastDirection = Literal["none", "yellow", "blue", "red", "green"]
IssueSeverity = Literal["info", "warning", "blocking"]


@dataclass(frozen=True)
class DecodedImage:
    """Validated, orientation-corrected, resized RGB image."""

    rgb: np.ndarray  # (H, W, 3) uint8
    width: int
    height: int
    original_width: int
    original_height: int
    format: Literal["jpeg", "png", "webp"]

    @property
    def size_ratio(self) -> float:
        return self.width / max(self.original_width, 1)


@dataclass(frozen=True)
class FaceData:
    """A single detected face."""

    landmarks_px: np.ndarray  # (478, 2) float32, pixel coordinates
    landmarks_norm: np.ndarray  # (478, 3) float32, normalised coordinates
    transform: np.ndarray | None  # (4, 4) facial transformation matrix
    bbox: tuple[float, float, float, float]  # x0, y0, x1, y1 in pixels

    @property
    def bbox_width(self) -> float:
        return self.bbox[2] - self.bbox[0]

    @property
    def bbox_height(self) -> float:
        return self.bbox[3] - self.bbox[1]


@dataclass(frozen=True)
class PoseAngles:
    yaw_degrees: float
    pitch_degrees: float
    roll_degrees: float


@dataclass(frozen=True)
class ExposureMetrics:
    mean_luma: float
    dark_pixel_ratio: float
    highlight_clip_ratio: float
    shadow_clip_ratio: float
    local_contrast: float
    status: ExposureStatus


@dataclass(frozen=True)
class LightingMetrics:
    left_right_luma_delta: float
    top_bottom_luma_delta: float


@dataclass(frozen=True)
class CastMetrics:
    shift_a: float
    shift_b: float
    magnitude: float
    direction: CastDirection


@dataclass(frozen=True)
class QualityIssue:
    code: str
    message: str
    severity: IssueSeverity


@dataclass(frozen=True)
class QualityReportData:
    overall_score: float
    acceptable: bool
    components: dict[str, float]
    exposure: ExposureMetrics
    cast: CastMetrics
    pose: PoseAngles
    lighting: LightingMetrics
    blur_variance: float
    face_width_ratio: float
    issues: list[QualityIssue] = field(default_factory=list)
    retake_tips: list[str] = field(default_factory=list)
