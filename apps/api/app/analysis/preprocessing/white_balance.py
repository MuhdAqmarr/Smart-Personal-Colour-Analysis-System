"""White-patch illuminant estimation and von Kries correction.

Personal-colour analysis reads the *skin* as signal, so gray-world balancing
(which assumes the average of the scene is neutral) is unsafe here: on a
face-dominated frame it mistakes the skin's own warmth for an illuminant cast
and would neutralise the very undertone we measure.

White-patch is the appropriate estimator: the brightest near-neutral surfaces
(eye whites, specular highlights, light clothing/background) reflect the
illuminant. Under neutral light those pixels are near-grey, so the estimated
correction is ≈ identity and the undertone is preserved; under a coloured cast
they take the illuminant's hue, so the correction removes it.

Pure/deterministic and framework-free (see module siblings). Every tuning
value is passed in by the caller (from the classifier config).
"""

from __future__ import annotations

import numpy as np

_LUMA = np.array([0.299, 0.587, 0.114], dtype=np.float64)


def estimate_illuminant(
    rgb: np.ndarray, *, bright_percentile: float, clip_ceiling: float
) -> np.ndarray:
    """Estimate the illuminant RGB from the brightest non-clipped pixels.

    Returns a 3-vector (r, g, b). Clipped highlights (>= `clip_ceiling`) carry
    no chroma, so they are excluded; if too few pixels remain we fall back to
    the frame mean (a no-op-ish neutral estimate).
    """
    pixels = np.asarray(rgb, dtype=np.float64).reshape(-1, 3)
    unclipped = pixels[(pixels < clip_ceiling).all(axis=1)]
    source = unclipped if unclipped.shape[0] >= 50 else pixels
    luma_source = source @ _LUMA
    threshold = np.quantile(luma_source, bright_percentile)
    bright = source[luma_source >= threshold]
    if bright.shape[0] < 20:
        bright = source
    return bright.mean(axis=0)


def white_balance_gains(
    illuminant: np.ndarray, *, strength: float, gain_clamp: float
) -> np.ndarray:
    """Von Kries per-channel gains that map `illuminant` toward neutral grey.

    Luminance-preserving (gains centre on the illuminant's own mean), clamped
    to [1/gain_clamp, gain_clamp] so a bad estimate can't wildly recolour the
    image, and scaled by `strength` in [0, 1] (0 = identity, 1 = full).
    """
    illum = np.asarray(illuminant, dtype=np.float64)
    grey = float(illum.mean())
    if grey <= 1e-6:
        return np.ones(3, dtype=np.float64)
    gains = grey / np.clip(illum, 1e-6, None)
    gains = np.clip(gains, 1.0 / gain_clamp, gain_clamp)
    return 1.0 + strength * (gains - 1.0)


def apply_white_balance(
    rgb: np.ndarray,
    *,
    bright_percentile: float,
    clip_ceiling: float,
    strength: float,
    gain_clamp: float,
) -> tuple[np.ndarray, np.ndarray]:
    """Return (corrected uint8 image, applied gains).

    On an already-neutral image the gains are ≈ 1, so the result is ≈ the
    input — the undertone is left intact.
    """
    illuminant = estimate_illuminant(
        rgb, bright_percentile=bright_percentile, clip_ceiling=clip_ceiling
    )
    gains = white_balance_gains(illuminant, strength=strength, gain_clamp=gain_clamp)
    corrected = np.clip(np.asarray(rgb, dtype=np.float64) * gains, 0.0, 255.0).astype(np.uint8)
    return corrected, gains
