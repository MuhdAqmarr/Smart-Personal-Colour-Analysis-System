"""White-patch white balance: neutral no-op, clamping, and cast robustness.

The point of the correction is robustness to coloured lighting: a photo taken
under a yellow/blue/etc. light should still resolve to the season it would
under neutral light — while a genuinely neutral photo is left untouched (its
true undertone preserved).
"""

from __future__ import annotations

import io

import numpy as np
import pytest
from app.analysis.pipeline import run_full_analysis
from app.analysis.preprocessing.white_balance import (
    apply_white_balance,
    estimate_illuminant,
    white_balance_gains,
)
from app.core.classifier import get_classifier_config
from PIL import Image

from tests import fixtures

pytestmark = pytest.mark.filterwarnings("ignore")

_WB = {"bright_percentile": 0.97, "clip_ceiling": 250.0, "gain_clamp": 1.5}


def _decode(data: bytes) -> np.ndarray:
    return np.asarray(Image.open(io.BytesIO(data)).convert("RGB"))


def _analyse(data: bytes):  # noqa: ANN202 - test helper
    return run_full_analysis(
        data,
        declared_mime="image/jpeg",
        filename="face.jpg",
        config=get_classifier_config(),
        max_upload_bytes=20_000_000,
        allow_low_quality=True,
    )


def test_gains_identity_on_neutral_illuminant() -> None:
    gains = white_balance_gains(np.array([200.0, 200.0, 200.0]), strength=1.0, gain_clamp=1.5)
    assert np.allclose(gains, 1.0, atol=1e-6)


def test_gains_are_clamped_for_an_extreme_illuminant() -> None:
    gains = white_balance_gains(np.array([255.0, 20.0, 20.0]), strength=1.0, gain_clamp=1.5)
    assert (gains <= 1.5 + 1e-9).all()
    assert (gains >= 1.0 / 1.5 - 1e-9).all()


def test_strength_scales_toward_identity() -> None:
    illum = np.array([220.0, 190.0, 150.0])  # warm illuminant
    full = white_balance_gains(illum, strength=1.0, gain_clamp=2.0)
    half = white_balance_gains(illum, strength=0.5, gain_clamp=2.0)
    assert np.all(np.abs(half - 1.0) <= np.abs(full - 1.0) + 1e-9)


def test_neutral_photo_is_left_almost_untouched() -> None:
    rgb = _decode(fixtures.valid_face_bytes())
    _, gains = apply_white_balance(rgb, strength=1.0, **_WB)
    # White-patch on a neutrally-lit frame estimates a near-neutral illuminant,
    # so the correction is close to identity and the undertone is preserved.
    assert np.allclose(gains, 1.0, atol=0.12)


def test_estimate_illuminant_follows_a_cast() -> None:
    yellow = _decode(fixtures.colour_cast_bytes("yellow"))
    illum = estimate_illuminant(yellow, bright_percentile=0.97, clip_ceiling=250.0)
    # A yellow cast lifts R/G and drops B in the brightest pixels.
    assert illum[2] < illum[0] and illum[2] < illum[1]


def test_cast_variants_recover_the_neutral_season() -> None:
    base = _analyse(fixtures.valid_face_bytes())
    for direction in ("yellow", "blue", "red", "green"):
        variant = _analyse(fixtures.colour_cast_bytes(direction))
        assert variant.seasons.season == base.seasons.season, (
            f"{direction} cast classified as {variant.seasons.season}, "
            f"expected {base.seasons.season}"
        )
