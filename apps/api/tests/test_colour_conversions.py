from __future__ import annotations

import numpy as np
import pytest
from app.analysis.colour_features.conversions import (
    lab_chroma,
    lab_hue_degrees,
    linear_to_srgb,
    luma_bt601,
    rgb_to_hex,
    rgb_to_hsv,
    rgb_to_lab,
    rgb_to_xyz,
    srgb_to_linear,
    xyz_to_lab,
)

# Canonical reference values (sRGB D65, CIE 1976 L*a*b*).


def test_white_maps_to_lab_100_0_0() -> None:
    lab = rgb_to_lab(np.array([255, 255, 255], dtype=np.uint8))
    assert lab[0] == pytest.approx(100.0, abs=1e-3)
    assert lab[1] == pytest.approx(0.0, abs=1e-3)
    assert lab[2] == pytest.approx(0.0, abs=1e-3)


def test_black_maps_to_lab_zero() -> None:
    lab = rgb_to_lab(np.array([0, 0, 0], dtype=np.uint8))
    assert np.allclose(lab, [0.0, 0.0, 0.0], atol=1e-6)


def test_mid_gray_l_star() -> None:
    # #808080 → L* ≈ 53.585, neutral axis.
    lab = rgb_to_lab(np.array([128, 128, 128], dtype=np.uint8))
    assert lab[0] == pytest.approx(53.585, abs=0.01)
    assert abs(lab[1]) < 1e-3
    assert abs(lab[2]) < 1e-3


def test_srgb_red_reference_lab() -> None:
    # Canonical values for sRGB primary red: L*=53.24, a*=80.09, b*=67.20.
    lab = rgb_to_lab(np.array([255, 0, 0], dtype=np.uint8))
    assert lab[0] == pytest.approx(53.24, abs=0.05)
    assert lab[1] == pytest.approx(80.09, abs=0.15)
    assert lab[2] == pytest.approx(67.20, abs=0.15)


def test_srgb_blue_reference_lab() -> None:
    # Canonical values for sRGB primary blue: L*=32.30, a*=79.19, b*=-107.86.
    lab = rgb_to_lab(np.array([0, 0, 255], dtype=np.uint8))
    assert lab[0] == pytest.approx(32.30, abs=0.05)
    assert lab[1] == pytest.approx(79.19, abs=0.15)
    assert lab[2] == pytest.approx(-107.86, abs=0.15)


def test_d65_white_xyz() -> None:
    xyz = rgb_to_xyz(np.array([255, 255, 255], dtype=np.uint8))
    assert xyz[0] == pytest.approx(0.95047, abs=2e-4)
    assert xyz[1] == pytest.approx(1.0, abs=2e-4)
    assert xyz[2] == pytest.approx(1.08883, abs=2e-4)


def test_transfer_function_round_trip() -> None:
    values = np.linspace(0, 1, 64)
    assert np.allclose(linear_to_srgb(srgb_to_linear(values)), values, atol=1e-9)


def test_transfer_function_breakpoint_continuity() -> None:
    below, above = srgb_to_linear(np.array([0.04044999, 0.04045001]))
    assert above - below < 1e-6


def test_vectorised_matches_scalar() -> None:
    rng = np.random.default_rng(7)
    pixels = rng.integers(0, 256, size=(50, 3), dtype=np.uint8)
    batch = rgb_to_lab(pixels)
    for i in range(50):
        single = rgb_to_lab(pixels[i])
        assert np.allclose(batch[i], single, atol=1e-9)


def test_chroma_and_hue_angle() -> None:
    lab = np.array([50.0, 3.0, 4.0])
    assert lab_chroma(lab) == pytest.approx(5.0)
    assert lab_hue_degrees(lab) == pytest.approx(np.degrees(np.arctan2(4.0, 3.0)))
    # Neutral axis: hue defined as 0 by convention (atan2(0,0)=0).
    assert lab_hue_degrees(np.array([50.0, 0.0, 0.0])) == pytest.approx(0.0)


def test_hue_angle_wraps_to_0_360() -> None:
    lab = np.array([50.0, 3.0, -4.0])  # fourth quadrant → 306.87°
    assert lab_hue_degrees(lab) == pytest.approx(306.87, abs=0.01)


def test_rgb_to_hsv_known_values() -> None:
    hsv = rgb_to_hsv(np.array([255, 0, 0], dtype=np.uint8))
    assert hsv[0] == pytest.approx(0.0)
    assert hsv[1] == pytest.approx(1.0)
    assert hsv[2] == pytest.approx(1.0)

    hsv = rgb_to_hsv(np.array([0, 255, 0], dtype=np.uint8))
    assert hsv[0] == pytest.approx(120.0)

    hsv = rgb_to_hsv(np.array([128, 128, 128], dtype=np.uint8))
    assert hsv[1] == pytest.approx(0.0)
    assert hsv[2] == pytest.approx(128 / 255)


def test_rgb_to_hex() -> None:
    assert rgb_to_hex(np.array([255, 0, 128], dtype=np.uint8)) == "#ff0080"
    assert rgb_to_hex(np.array([0, 0, 0], dtype=np.uint8)) == "#000000"
    assert rgb_to_hex(np.array([1.0, 1.0, 1.0])) == "#ffffff"


def test_luma_bt601_weights() -> None:
    assert float(luma_bt601(np.array([[255, 255, 255]], dtype=np.uint8))[0]) == pytest.approx(255.0)
    green = float(luma_bt601(np.array([[0, 255, 0]], dtype=np.uint8))[0])
    assert green == pytest.approx(0.587 * 255, abs=1e-6)


def test_skin_tone_lab_is_plausible() -> None:
    # A representative medium skin tone should land in documented ranges:
    # warm hue angle (roughly 40–70°) and moderate chroma.
    lab = rgb_to_lab(np.array([198, 152, 118], dtype=np.uint8))
    hue = float(lab_hue_degrees(lab))
    chroma = float(lab_chroma(lab))
    assert 40.0 < hue < 75.0
    assert 15.0 < chroma < 40.0
    assert 55.0 < lab[0] < 75.0


def test_xyz_to_lab_below_epsilon_branch() -> None:
    # Very dark colours exercise the linear segment of the f() function.
    lab = xyz_to_lab(np.array([0.001, 0.001, 0.001]))
    assert lab[0] == pytest.approx(0.9033, abs=1e-3)
