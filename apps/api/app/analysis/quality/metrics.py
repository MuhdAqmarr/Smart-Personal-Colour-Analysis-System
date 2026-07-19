"""Individual image-quality metrics.

All functions are pure. Face-region metrics take an explicit bounding box
so they are unit-testable on synthetic images without a detector.
Thresholds live in the classifier configuration, not here.
"""

from __future__ import annotations

import cv2
import numpy as np

from app.analysis.colour_features.conversions import luma_bt601, rgb_to_lab
from app.analysis.types import (
    CastDirection,
    CastMetrics,
    ExposureMetrics,
    ExposureStatus,
    LightingMetrics,
)


def _crop(rgb: np.ndarray, bbox: tuple[float, float, float, float]) -> np.ndarray:
    height, width = rgb.shape[:2]
    x0 = int(np.clip(np.floor(bbox[0]), 0, width - 1))
    y0 = int(np.clip(np.floor(bbox[1]), 0, height - 1))
    x1 = int(np.clip(np.ceil(bbox[2]), x0 + 1, width))
    y1 = int(np.clip(np.ceil(bbox[3]), y0 + 1, height))
    return rgb[y0:y1, x0:x1]


def blur_variance_of_laplacian(
    rgb: np.ndarray,
    bbox: tuple[float, float, float, float],
    *,
    analysis_width: int,
) -> float:
    """Variance of the Laplacian on the face crop, resized to a standard
    width so the metric is comparable across image resolutions."""
    crop = _crop(rgb, bbox)
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    if gray.shape[1] != analysis_width:
        scale = analysis_width / gray.shape[1]
        new_height = max(8, int(round(gray.shape[0] * scale)))
        gray = cv2.resize(gray, (analysis_width, new_height), interpolation=cv2.INTER_AREA)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    return float(laplacian.var())


def exposure_metrics(
    rgb: np.ndarray,
    bbox: tuple[float, float, float, float],
    *,
    dark_pixel_threshold: float,
    highlight_clip_threshold: float,
    shadow_clip_threshold: float,
    min_mean_luma: float,
    max_mean_luma: float,
    max_dark_pixel_ratio: float,
    max_highlight_clip_ratio: float,
    max_shadow_clip_ratio: float,
    min_local_contrast: float,
    max_left_right_delta_for_status: float,
) -> ExposureMetrics:
    """Exposure statistics over the face region with a categorical status."""
    face = _crop(rgb, bbox)
    luma = luma_bt601(face)

    mean_luma = float(luma.mean())
    dark_ratio = float((luma < dark_pixel_threshold).mean())
    highlight_ratio = float((luma > highlight_clip_threshold).mean())
    shadow_ratio = float((luma < shadow_clip_threshold).mean())
    local_contrast = float(luma.std())

    half = face.shape[1] // 2
    left_mean = float(luma_bt601(face[:, :half]).mean()) if half > 0 else mean_luma
    right_mean = float(luma_bt601(face[:, half:]).mean()) if half > 0 else mean_luma
    side_delta = abs(left_mean - right_mean)

    status: ExposureStatus
    if mean_luma < min_mean_luma or dark_ratio > max_dark_pixel_ratio:
        status = "too_dark"
    elif mean_luma > max_mean_luma or highlight_ratio > max_highlight_clip_ratio:
        status = "too_bright"
    elif shadow_ratio > max_shadow_clip_ratio:
        status = "strong_shadow"
    elif side_delta > max_left_right_delta_for_status:
        status = "uneven_lighting"
    elif local_contrast < min_local_contrast:
        status = "low_contrast"
    else:
        status = "acceptable"

    return ExposureMetrics(
        mean_luma=mean_luma,
        dark_pixel_ratio=dark_ratio,
        highlight_clip_ratio=highlight_ratio,
        shadow_clip_ratio=shadow_ratio,
        local_contrast=local_contrast,
        status=status,
    )


def lighting_consistency(
    rgb: np.ndarray, bbox: tuple[float, float, float, float]
) -> LightingMetrics:
    """Mean-luma deltas between face halves (left/right and top/bottom)."""
    face = _crop(rgb, bbox)
    luma = luma_bt601(face)
    half_x = max(1, face.shape[1] // 2)
    half_y = max(1, face.shape[0] // 2)
    left = float(luma[:, :half_x].mean())
    right = float(luma[:, half_x:].mean()) if face.shape[1] > half_x else left
    top = float(luma[:half_y, :].mean())
    bottom = float(luma[half_y:, :].mean()) if face.shape[0] > half_y else top
    return LightingMetrics(
        left_right_luma_delta=abs(left - right),
        top_bottom_luma_delta=abs(top - bottom),
    )


def estimate_colour_cast(
    rgb: np.ndarray,
    bbox: tuple[float, float, float, float] | None,
    *,
    gray_world_weight: float,
    face_consistency_weight: float,
    warn_ab_shift: float,
) -> CastMetrics:
    """Environmental colour-cast estimate.

    Combines:
    - a gray-world estimate over the full frame: the average scene colour,
      luminance-normalised, should be near-neutral in a* / b*;
    - face-halves consistency: with neutral light, the a*/b* difference
      between the two face halves is small; coloured side-lighting shows
      up as an asymmetric shift.

    The combined (a*, b*) shift vector is classified into a direction when
    its magnitude exceeds `warn_ab_shift`.
    """
    frame_mean_rgb = np.asarray(rgb, dtype=np.float64).reshape(-1, 3).mean(axis=0)
    # Normalise luminance so only chromaticity remains, then measure a*/b*.
    frame_mean_rgb = np.clip(frame_mean_rgb, 1.0, 255.0)
    scale = 128.0 / max(float(luma_bt601(frame_mean_rgb.reshape(1, 3))[0]), 1e-6)
    normalised = np.clip(frame_mean_rgb * scale, 0.0, 255.0).astype(np.float64)
    frame_lab = rgb_to_lab(normalised / 255.0)
    frame_shift = np.array([frame_lab[1], frame_lab[2]])

    halves_shift = np.zeros(2)
    if bbox is not None:
        face = _crop(rgb, bbox)
        half = face.shape[1] // 2
        if half > 0:
            left_mean = face[:, :half].reshape(-1, 3).mean(axis=0)
            right_mean = face[:, half:].reshape(-1, 3).mean(axis=0)
            left_lab = rgb_to_lab(np.clip(left_mean, 0, 255).astype(np.float64) / 255.0)
            right_lab = rgb_to_lab(np.clip(right_mean, 0, 255).astype(np.float64) / 255.0)
            halves_shift = np.array([left_lab[1] - right_lab[1], left_lab[2] - right_lab[2]])

    shift = gray_world_weight * frame_shift + face_consistency_weight * np.abs(halves_shift)
    shift_a, shift_b = float(shift[0]), float(shift[1])
    magnitude = float(np.hypot(shift_a, shift_b))

    direction: CastDirection = "none"
    if magnitude > warn_ab_shift:
        if abs(shift_b) >= abs(shift_a):
            direction = "yellow" if shift_b > 0 else "blue"
        else:
            direction = "red" if shift_a > 0 else "green"

    return CastMetrics(shift_a=shift_a, shift_b=shift_b, magnitude=magnitude, direction=direction)
