"""Colour-space conversions (vectorised, D65 reference white).

Implements the exact sRGB (IEC 61966-2-1) transfer function and the CIE
1976 L*a*b* transform. These utilities are the single source of colour
mathematics for the pipeline — browser/CSS conversions are never used.

Conventions:
- sRGB inputs are uint8 [0, 255] or float [0, 1] arrays with a trailing
  axis of size 3.
- XYZ is scaled so that Y(white) = 1.0.
- Reference white: D65 (Xn=0.95047, Yn=1.0, Zn=1.08883).
"""

from __future__ import annotations

import numpy as np

# sRGB → XYZ matrix (IEC 61966-2-1, D65).
_SRGB_TO_XYZ = np.array(
    [
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041],
    ]
)

_D65 = np.array([0.95047, 1.0, 1.08883])

_EPSILON = 216 / 24389  # CIE standard intent
_KAPPA = 24389 / 27


def srgb_to_linear(srgb: np.ndarray) -> np.ndarray:
    """sRGB [0,1] → linear RGB [0,1] (exact piecewise transfer function)."""
    srgb = np.asarray(srgb, dtype=np.float64)
    return np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(linear: np.ndarray) -> np.ndarray:
    linear = np.clip(np.asarray(linear, dtype=np.float64), 0.0, 1.0)
    return np.where(linear <= 0.0031308, linear * 12.92, 1.055 * np.power(linear, 1 / 2.4) - 0.055)


def _normalise_rgb(rgb: np.ndarray) -> np.ndarray:
    rgb = np.asarray(rgb)
    if rgb.dtype == np.uint8:
        return rgb.astype(np.float64) / 255.0
    return np.clip(rgb.astype(np.float64), 0.0, 1.0)


def rgb_to_xyz(rgb: np.ndarray) -> np.ndarray:
    """sRGB (uint8 or [0,1] float) → CIE XYZ (Y white = 1.0)."""
    linear = srgb_to_linear(_normalise_rgb(rgb))
    return np.asarray(linear @ _SRGB_TO_XYZ.T)


def xyz_to_lab(xyz: np.ndarray) -> np.ndarray:
    xyz = np.asarray(xyz, dtype=np.float64)
    scaled = xyz / _D65

    f = np.where(scaled > _EPSILON, np.cbrt(scaled), (_KAPPA * scaled + 16.0) / 116.0)
    fx, fy, fz = f[..., 0], f[..., 1], f[..., 2]

    lab = np.empty_like(xyz)
    lab[..., 0] = 116.0 * fy - 16.0
    lab[..., 1] = 500.0 * (fx - fy)
    lab[..., 2] = 200.0 * (fy - fz)
    return lab


def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    return xyz_to_lab(rgb_to_xyz(rgb))


def lab_chroma(lab: np.ndarray) -> np.ndarray:
    """C*ab = sqrt(a*² + b*²)."""
    lab = np.asarray(lab, dtype=np.float64)
    return np.asarray(np.hypot(lab[..., 1], lab[..., 2]))


def lab_hue_degrees(lab: np.ndarray) -> np.ndarray:
    """hab = atan2(b*, a*) in degrees, wrapped to [0, 360)."""
    lab = np.asarray(lab, dtype=np.float64)
    hue = np.degrees(np.arctan2(lab[..., 2], lab[..., 1]))
    return np.asarray(np.mod(hue, 360.0))


def rgb_to_hsv(rgb: np.ndarray) -> np.ndarray:
    """sRGB → HSV with H in degrees [0, 360), S and V in [0, 1]."""
    rgb = _normalise_rgb(rgb)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    maximum = np.maximum(np.maximum(r, g), b)
    minimum = np.minimum(np.minimum(r, g), b)
    delta = maximum - minimum

    hue = np.zeros_like(maximum)
    non_zero = delta > 1e-12
    r_max = non_zero & (maximum == r)
    g_max = non_zero & (maximum == g) & ~r_max
    b_max = non_zero & ~r_max & ~g_max

    hue[r_max] = np.mod((g[r_max] - b[r_max]) / delta[r_max], 6.0)
    hue[g_max] = (b[g_max] - r[g_max]) / delta[g_max] + 2.0
    hue[b_max] = (r[b_max] - g[b_max]) / delta[b_max] + 4.0
    hue = hue * 60.0

    saturation = np.where(maximum > 1e-12, delta / np.where(maximum > 1e-12, maximum, 1.0), 0.0)
    return np.stack([hue, saturation, maximum], axis=-1)


def rgb_to_hex(rgb: np.ndarray) -> str:
    """A single RGB triple (uint8 or [0,1] float) → '#rrggbb'."""
    values = np.asarray(rgb, dtype=np.float64).reshape(3)
    if values.max() <= 1.0 and np.asarray(rgb).dtype != np.uint8:
        values = values * 255.0
    r, g, b = (int(round(float(v))) for v in np.clip(values, 0, 255))
    return f"#{r:02x}{g:02x}{b:02x}"


def luma_bt601(rgb: np.ndarray) -> np.ndarray:
    """Luma (BT.601 weights) on gamma-encoded values, range [0, 255]."""
    rgb = np.asarray(rgb, dtype=np.float64)
    if rgb.max() <= 1.0:
        rgb = rgb * 255.0
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
