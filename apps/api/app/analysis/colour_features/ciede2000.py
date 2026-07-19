"""CIEDE2000 colour difference (Sharma, Wu & Dalal 2005 formulation).

Used for palette/product matching and ROI-consistency scoring. Verified
against the complete set of 34 published test pairs from Sharma et al.
"""

from __future__ import annotations

import numpy as np


def delta_e_2000(lab1: np.ndarray, lab2: np.ndarray) -> np.ndarray:
    """ΔE00 between Lab colours. Broadcasts over leading dimensions.

    Parameters are arrays with a trailing axis of size 3 (L*, a*, b*).
    kL = kC = kH = 1 (the standard reference conditions).
    """
    lab1 = np.asarray(lab1, dtype=np.float64)
    lab2 = np.asarray(lab2, dtype=np.float64)

    l1, a1, b1 = lab1[..., 0], lab1[..., 1], lab1[..., 2]
    l2, a2, b2 = lab2[..., 0], lab2[..., 1], lab2[..., 2]

    c1 = np.hypot(a1, b1)
    c2 = np.hypot(a2, b2)
    c_bar = (c1 + c2) / 2.0

    c_bar7 = c_bar**7
    g = 0.5 * (1.0 - np.sqrt(c_bar7 / (c_bar7 + 25.0**7)))

    a1_prime = (1.0 + g) * a1
    a2_prime = (1.0 + g) * a2
    c1_prime = np.hypot(a1_prime, b1)
    c2_prime = np.hypot(a2_prime, b2)

    h1_prime = np.degrees(np.arctan2(b1, a1_prime))
    h1_prime = np.where(h1_prime < 0, h1_prime + 360.0, h1_prime)
    h1_prime = np.where((np.abs(b1) < 1e-14) & (np.abs(a1_prime) < 1e-14), 0.0, h1_prime)
    h2_prime = np.degrees(np.arctan2(b2, a2_prime))
    h2_prime = np.where(h2_prime < 0, h2_prime + 360.0, h2_prime)
    h2_prime = np.where((np.abs(b2) < 1e-14) & (np.abs(a2_prime) < 1e-14), 0.0, h2_prime)

    delta_l_prime = l2 - l1
    delta_c_prime = c2_prime - c1_prime

    c_product_zero = (c1_prime * c2_prime) < 1e-14
    h_diff = h2_prime - h1_prime
    delta_h_small = np.where(
        h_diff > 180.0, h_diff - 360.0, np.where(h_diff < -180.0, h_diff + 360.0, h_diff)
    )
    delta_h_small = np.where(c_product_zero, 0.0, delta_h_small)
    delta_h_prime = 2.0 * np.sqrt(c1_prime * c2_prime) * np.sin(np.radians(delta_h_small) / 2.0)

    l_bar_prime = (l1 + l2) / 2.0
    c_bar_prime = (c1_prime + c2_prime) / 2.0

    h_sum = h1_prime + h2_prime
    h_abs_diff = np.abs(h1_prime - h2_prime)
    h_bar_prime = np.where(
        c_product_zero,
        h_sum,
        np.where(
            h_abs_diff <= 180.0,
            h_sum / 2.0,
            np.where(h_sum < 360.0, (h_sum + 360.0) / 2.0, (h_sum - 360.0) / 2.0),
        ),
    )

    t = (
        1.0
        - 0.17 * np.cos(np.radians(h_bar_prime - 30.0))
        + 0.24 * np.cos(np.radians(2.0 * h_bar_prime))
        + 0.32 * np.cos(np.radians(3.0 * h_bar_prime + 6.0))
        - 0.20 * np.cos(np.radians(4.0 * h_bar_prime - 63.0))
    )

    delta_theta = 30.0 * np.exp(-(((h_bar_prime - 275.0) / 25.0) ** 2))
    c_bar_prime7 = c_bar_prime**7
    r_c = 2.0 * np.sqrt(c_bar_prime7 / (c_bar_prime7 + 25.0**7))
    r_t = -np.sin(np.radians(2.0 * delta_theta)) * r_c

    l_minus_50_sq = (l_bar_prime - 50.0) ** 2
    s_l = 1.0 + (0.015 * l_minus_50_sq) / np.sqrt(20.0 + l_minus_50_sq)
    s_c = 1.0 + 0.045 * c_bar_prime
    s_h = 1.0 + 0.015 * c_bar_prime * t

    term_l = delta_l_prime / s_l
    term_c = delta_c_prime / s_c
    term_h = delta_h_prime / s_h

    return np.asarray(np.sqrt(term_l**2 + term_c**2 + term_h**2 + r_t * term_c * term_h))


def delta_e_2000_scalar(
    lab1: tuple[float, float, float], lab2: tuple[float, float, float]
) -> float:
    return float(delta_e_2000(np.array(lab1), np.array(lab2)))
