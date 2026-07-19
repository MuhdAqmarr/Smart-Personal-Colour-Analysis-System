"""Skin-pixel candidate filtering and robust colour aggregation.

For each ROI (spec §14): extract candidate pixels → reject extreme
dark/bright pixels → reject specular highlights → reject highly saturated
non-skin outliers → remove statistical outliers (median absolute deviation)
→ aggregate with median and trimmed mean.

Fixed RGB "skin thresholds" are deliberately NOT used — landmarks provide
the spatial constraint and robust statistics carry the correctness burden.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from app.analysis.colour_features.conversions import (
    lab_chroma,
    lab_hue_degrees,
    rgb_to_hex,
    rgb_to_hsv,
    rgb_to_lab,
)


@dataclass(frozen=True)
class RegionColourSample:
    region: str
    rgb_median: tuple[float, float, float]
    rgb_trimmed_mean: tuple[float, float, float]
    rgb_std: tuple[float, float, float]
    hex: str
    hsv: tuple[float, float, float]
    lab: tuple[float, float, float]
    chroma: float
    hue_angle_degrees: float
    total_pixels: int
    usable_pixels: int

    @property
    def usable_ratio(self) -> float:
        return self.usable_pixels / self.total_pixels if self.total_pixels else 0.0


def filter_and_aggregate(
    rgb_image: np.ndarray,
    mask: np.ndarray,
    region_name: str,
    filter_config: dict[str, Any],
) -> RegionColourSample:
    """Apply the pixel-filter cascade and aggregate the surviving pixels."""
    candidates = rgb_image[mask]
    total = int(candidates.shape[0])
    if total == 0:
        return _empty_sample(region_name)

    lab = rgb_to_lab(candidates)
    l_star = lab[..., 0]
    chroma = lab_chroma(lab)

    min_l = float(filter_config["minLStar"])
    max_l = float(filter_config["maxLStar"])
    max_chroma = float(filter_config["maxChroma"])
    highlight_l = float(filter_config["highlightLStar"])
    highlight_chroma = float(filter_config["highlightChromaMax"])

    keep = (
        (l_star >= min_l)  # extreme shadow
        & (l_star <= max_l)  # extreme brightness
        & (chroma <= max_chroma)  # saturated non-skin (clothing, lips)
        & ~((l_star > highlight_l) & (chroma < highlight_chroma))  # specular highlight
    )

    kept_lab = lab[keep]
    kept_rgb = candidates[keep]
    if kept_lab.shape[0] < 8:
        return _empty_sample(region_name, total_pixels=total)

    # Median-absolute-deviation rejection on each Lab axis.
    k = float(filter_config["madK"])
    inlier = np.ones(kept_lab.shape[0], dtype=bool)
    for axis in range(3):
        values = kept_lab[:, axis]
        median = np.median(values)
        mad = np.median(np.abs(values - median))
        if mad < 1e-9:
            continue
        # 1.4826 scales MAD to the standard deviation of a normal distribution.
        inlier &= np.abs(values - median) <= k * 1.4826 * mad

    final_rgb = kept_rgb[inlier]
    if final_rgb.shape[0] < 8:
        return _empty_sample(region_name, total_pixels=total)

    trim = float(filter_config["trimmedMeanFraction"])
    median_rgb = np.median(final_rgb, axis=0)
    trimmed_rgb = _trimmed_mean(final_rgb.astype(np.float64), trim)
    std_rgb = final_rgb.astype(np.float64).std(axis=0)

    representative = np.clip(np.round(median_rgb), 0, 255).astype(np.uint8)
    lab_rep = rgb_to_lab(representative)
    hsv_rep = rgb_to_hsv(representative)

    return RegionColourSample(
        region=region_name,
        rgb_median=(float(median_rgb[0]), float(median_rgb[1]), float(median_rgb[2])),
        rgb_trimmed_mean=(float(trimmed_rgb[0]), float(trimmed_rgb[1]), float(trimmed_rgb[2])),
        rgb_std=(float(std_rgb[0]), float(std_rgb[1]), float(std_rgb[2])),
        hex=rgb_to_hex(representative),
        hsv=(float(hsv_rep[0]), float(hsv_rep[1]), float(hsv_rep[2])),
        lab=(float(lab_rep[0]), float(lab_rep[1]), float(lab_rep[2])),
        chroma=float(lab_chroma(lab_rep)),
        hue_angle_degrees=float(lab_hue_degrees(lab_rep)),
        total_pixels=total,
        usable_pixels=int(final_rgb.shape[0]),
    )


def _trimmed_mean(values: np.ndarray, fraction: float) -> np.ndarray:
    """Per-channel trimmed mean, dropping `fraction` from each tail."""
    if values.shape[0] == 0:
        return np.zeros(values.shape[1])
    cut = int(values.shape[0] * fraction)
    ordered = np.sort(values, axis=0)
    trimmed = ordered[cut : values.shape[0] - cut] if values.shape[0] > 2 * cut else ordered
    return np.asarray(trimmed.mean(axis=0))


def _empty_sample(region_name: str, total_pixels: int = 0) -> RegionColourSample:
    return RegionColourSample(
        region=region_name,
        rgb_median=(0.0, 0.0, 0.0),
        rgb_trimmed_mean=(0.0, 0.0, 0.0),
        rgb_std=(0.0, 0.0, 0.0),
        hex="#000000",
        hsv=(0.0, 0.0, 0.0),
        lab=(0.0, 0.0, 0.0),
        chroma=0.0,
        hue_angle_degrees=0.0,
        total_pixels=total_pixels,
        usable_pixels=0,
    )


def combined_sample(samples: list[RegionColourSample]) -> RegionColourSample:
    """Weighted combination of usable regions (weights = usable pixels).

    Cheeks and forehead are combined into the overall skin estimate used by
    the classifiers; unusable regions contribute nothing.
    """
    usable = [s for s in samples if s.usable_pixels > 0]
    if not usable:
        return _empty_sample("combined")

    weights = np.array([s.usable_pixels for s in usable], dtype=np.float64)
    weights /= weights.sum()

    median_rgb = np.average([s.rgb_median for s in usable], axis=0, weights=weights)
    trimmed_rgb = np.average([s.rgb_trimmed_mean for s in usable], axis=0, weights=weights)
    std_rgb = np.average([s.rgb_std for s in usable], axis=0, weights=weights)

    representative = np.clip(np.round(median_rgb), 0, 255).astype(np.uint8)
    lab_rep = rgb_to_lab(representative)
    hsv_rep = rgb_to_hsv(representative)

    return RegionColourSample(
        region="combined",
        rgb_median=(float(median_rgb[0]), float(median_rgb[1]), float(median_rgb[2])),
        rgb_trimmed_mean=(float(trimmed_rgb[0]), float(trimmed_rgb[1]), float(trimmed_rgb[2])),
        rgb_std=(float(std_rgb[0]), float(std_rgb[1]), float(std_rgb[2])),
        hex=rgb_to_hex(representative),
        hsv=(float(hsv_rep[0]), float(hsv_rep[1]), float(hsv_rep[2])),
        lab=(float(lab_rep[0]), float(lab_rep[1]), float(lab_rep[2])),
        chroma=float(lab_chroma(lab_rep)),
        hue_angle_degrees=float(lab_hue_degrees(lab_rep)),
        total_pixels=sum(s.total_pixels for s in usable),
        usable_pixels=sum(s.usable_pixels for s in usable),
    )
