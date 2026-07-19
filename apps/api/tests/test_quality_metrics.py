from __future__ import annotations

import numpy as np
import pytest
from app.analysis.quality.metrics import (
    blur_variance_of_laplacian,
    estimate_colour_cast,
    exposure_metrics,
    lighting_consistency,
)

FULL = (0.0, 0.0, 256.0, 256.0)

EXPOSURE_KWARGS = {
    "dark_pixel_threshold": 30,
    "highlight_clip_threshold": 250,
    "shadow_clip_threshold": 8,
    "min_mean_luma": 70,
    "max_mean_luma": 205,
    "max_dark_pixel_ratio": 0.28,
    "max_highlight_clip_ratio": 0.06,
    "max_shadow_clip_ratio": 0.12,
    "min_local_contrast": 16,
    "max_left_right_delta_for_status": 30,
}


def uniform(level: int, size: int = 256) -> np.ndarray:
    return np.full((size, size, 3), level, dtype=np.uint8)


def checkerboard(size: int = 256, cell: int = 8) -> np.ndarray:
    tile = np.indices((size, size)).sum(axis=0) // cell % 2
    board = (tile * 255).astype(np.uint8)
    return np.stack([board] * 3, axis=-1)


class TestBlur:
    def test_sharp_pattern_has_high_variance(self) -> None:
        sharp = blur_variance_of_laplacian(checkerboard(), FULL, analysis_width=256)
        assert sharp > 1000

    def test_uniform_image_has_zero_variance(self) -> None:
        flat = blur_variance_of_laplacian(uniform(128), FULL, analysis_width=256)
        assert flat == pytest.approx(0.0, abs=1e-6)

    def test_blur_reduces_variance(self) -> None:
        import cv2

        sharp_img = checkerboard()
        blurred = cv2.GaussianBlur(sharp_img, (21, 21), 8)
        sharp = blur_variance_of_laplacian(sharp_img, FULL, analysis_width=256)
        soft = blur_variance_of_laplacian(blurred, FULL, analysis_width=256)
        assert soft < sharp * 0.2

    def test_metric_is_resolution_invariant(self) -> None:
        import cv2

        small = checkerboard(256, cell=8)
        large = cv2.resize(small, (1024, 1024), interpolation=cv2.INTER_NEAREST)
        v_small = blur_variance_of_laplacian(small, (0, 0, 256, 256), analysis_width=256)
        v_large = blur_variance_of_laplacian(large, (0, 0, 1024, 1024), analysis_width=256)
        # Same structure at the analysis width ⇒ comparable variance.
        assert v_large == pytest.approx(v_small, rel=0.35)


class TestExposure:
    def test_textured_mid_gray_is_acceptable(self) -> None:
        # A uniform field is legitimately "low contrast"; a normally-lit
        # face has texture, modelled here as mild Gaussian noise.
        rng = np.random.default_rng(11)
        image = np.clip(rng.normal(128, 24, (256, 256, 3)), 0, 255).astype(np.uint8)
        result = exposure_metrics(image, FULL, **EXPOSURE_KWARGS)
        assert result.status == "acceptable"
        assert result.mean_luma == pytest.approx(128.0, abs=2.0)
        assert result.highlight_clip_ratio < 0.01

    def test_dark_image_flagged(self) -> None:
        result = exposure_metrics(uniform(20), FULL, **EXPOSURE_KWARGS)
        assert result.status == "too_dark"
        assert result.dark_pixel_ratio == 1.0

    def test_bright_image_flagged(self) -> None:
        result = exposure_metrics(uniform(252), FULL, **EXPOSURE_KWARGS)
        assert result.status == "too_bright"
        assert result.highlight_clip_ratio == 1.0

    def test_half_dark_half_bright_detected_as_uneven(self) -> None:
        image = uniform(160)
        image[:, :128] = 60  # left half dark
        result = exposure_metrics(image, FULL, **EXPOSURE_KWARGS)
        assert result.status == "uneven_lighting"

    def test_low_contrast_detected(self) -> None:
        rng = np.random.default_rng(3)
        image = np.clip(rng.normal(128, 2, (256, 256, 3)), 0, 255).astype(np.uint8)
        result = exposure_metrics(image, FULL, **EXPOSURE_KWARGS)
        assert result.status == "low_contrast"

    def test_shadow_clipping_detected(self) -> None:
        image = uniform(140)
        image[: int(256 * 0.2), :] = 2  # 20% pitch-black band
        result = exposure_metrics(image, FULL, **EXPOSURE_KWARGS)
        assert result.status == "strong_shadow"


class TestLighting:
    def test_even_lighting_has_small_deltas(self) -> None:
        result = lighting_consistency(uniform(150), FULL)
        assert result.left_right_luma_delta == pytest.approx(0.0, abs=1e-6)
        assert result.top_bottom_luma_delta == pytest.approx(0.0, abs=1e-6)

    def test_side_lighting_measured(self) -> None:
        image = uniform(170)
        image[:, :128] = 90
        result = lighting_consistency(image, FULL)
        assert result.left_right_luma_delta == pytest.approx(80.0, abs=1.0)


class TestColourCast:
    CAST_KWARGS = {"gray_world_weight": 0.6, "face_consistency_weight": 0.4, "warn_ab_shift": 5.0}

    def test_neutral_image_has_no_cast(self) -> None:
        result = estimate_colour_cast(uniform(128), FULL, **self.CAST_KWARGS)
        assert result.direction == "none"
        assert result.magnitude < 1.0

    def test_yellow_cast_detected(self) -> None:
        image = uniform(128).astype(np.float64)
        image[..., 0] *= 1.15
        image[..., 1] *= 1.08
        image[..., 2] *= 0.55
        result = estimate_colour_cast(
            np.clip(image, 0, 255).astype(np.uint8), FULL, **self.CAST_KWARGS
        )
        assert result.direction == "yellow"
        assert result.shift_b > 5.0

    def test_blue_cast_detected(self) -> None:
        image = uniform(128).astype(np.float64)
        image[..., 0] *= 0.6
        image[..., 2] *= 1.4
        result = estimate_colour_cast(
            np.clip(image, 0, 255).astype(np.uint8), FULL, **self.CAST_KWARGS
        )
        assert result.direction == "blue"
        assert result.shift_b < -5.0

    def test_red_cast_detected(self) -> None:
        image = uniform(128).astype(np.float64)
        image[..., 0] *= 1.5
        image[..., 1] *= 0.85
        image[..., 2] *= 1.02
        result = estimate_colour_cast(
            np.clip(image, 0, 255).astype(np.uint8), FULL, **self.CAST_KWARGS
        )
        assert result.direction == "red"

    def test_green_cast_detected(self) -> None:
        image = uniform(128).astype(np.float64)
        image[..., 0] *= 0.78
        image[..., 1] *= 1.35
        image[..., 2] *= 0.86
        result = estimate_colour_cast(
            np.clip(image, 0, 255).astype(np.uint8), FULL, **self.CAST_KWARGS
        )
        assert result.direction == "green"
