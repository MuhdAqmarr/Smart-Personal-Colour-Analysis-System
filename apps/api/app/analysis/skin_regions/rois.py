"""Skin regions of interest.

Regions are elliptical polygons positioned and scaled entirely from facial
landmarks (never fixed pixel boxes — spec §14):

- Forehead: centred between the glabella and the top of the face oval,
  sized from the temple-to-temple distance, rotated with the eye line.
- Cheeks: centred between the lower eyelid and the mouth corner, pushed
  outward toward the face edge, sized from the face width.

Eyes, eyebrows, lips, nostrils and hair are avoided geometrically; pixel
filtering (filtering.py) statistically rejects whatever residue remains
(hair strands, specular highlights, shadow).
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

import cv2
import numpy as np

from app.analysis.landmarks import geometry as g
from app.analysis.types import FaceData

RegionName = str  # "forehead" | "left_cheek" | "right_cheek"


@dataclass(frozen=True)
class RegionOfInterest:
    name: RegionName
    polygon: np.ndarray  # (N, 2) int32 pixel vertices
    mask: np.ndarray  # (H, W) bool


def _eye_line_angle_degrees(face: FaceData) -> float:
    left = g.anchor(face, g.LEFT_EYE_OUTER)
    right = g.anchor(face, g.RIGHT_EYE_OUTER)
    return math.degrees(math.atan2(left[1] - right[1], left[0] - right[0]))


def _ellipse_polygon(
    centre: np.ndarray,
    semi_axes: tuple[float, float],
    angle_degrees: float,
    vertices: int,
) -> np.ndarray:
    delta = max(1, round(360 / max(vertices, 8)))
    points = cv2.ellipse2Poly(
        (int(round(centre[0])), int(round(centre[1]))),
        (int(round(semi_axes[0])), int(round(semi_axes[1]))),
        int(round(angle_degrees)),
        0,
        360,
        delta,
    )
    return np.asarray(points, dtype=np.int32)


def _mask_from_polygon(shape: tuple[int, int], polygon: np.ndarray) -> np.ndarray:
    mask = np.zeros(shape, dtype=np.uint8)
    cv2.fillPoly(mask, [polygon], 1)
    return mask.astype(bool)


def build_rois(
    face: FaceData, image_shape: tuple[int, int], roi_config: dict[str, Any]
) -> list[RegionOfInterest]:
    """Construct forehead + left/right cheek ROIs for one face."""
    height, width = image_shape
    face_width = g.face_width(face)
    angle = _eye_line_angle_degrees(face)

    forehead_cfg = roi_config["forehead"]
    cheek_cfg = roi_config["cheek"]

    rois: list[RegionOfInterest] = []

    # --- Forehead --------------------------------------------------------
    glabella = g.anchor(face, g.GLABELLA)
    oval_top = g.anchor(face, g.FACE_OVAL_TOP)
    centre = glabella + float(forehead_cfg["centreGlabellaToOvalTopFraction"]) * (
        oval_top - glabella
    )
    semi_axes = (
        face_width * float(forehead_cfg["semiAxisWidthFactor"]),
        face_width * float(forehead_cfg["semiAxisHeightFactor"]),
    )
    polygon = _ellipse_polygon(centre, semi_axes, angle, int(forehead_cfg["polygonVertices"]))
    polygon[:, 0] = np.clip(polygon[:, 0], 0, width - 1)
    polygon[:, 1] = np.clip(polygon[:, 1], 0, height - 1)
    rois.append(
        RegionOfInterest(
            name="forehead",
            polygon=polygon,
            mask=_mask_from_polygon((height, width), polygon),
        )
    )

    # --- Cheeks -----------------------------------------------------------
    cheek_specs = [
        ("right_cheek", g.RIGHT_EYE_LOWER, g.RIGHT_MOUTH_CORNER, g.RIGHT_FACE_EDGE),
        ("left_cheek", g.LEFT_EYE_LOWER, g.LEFT_MOUTH_CORNER, g.LEFT_FACE_EDGE),
    ]
    for name, eyelid_idx, mouth_idx, edge_idx in cheek_specs:
        eyelid = g.anchor(face, eyelid_idx)
        mouth = g.anchor(face, mouth_idx)
        edge = g.anchor(face, edge_idx)
        centre = eyelid + float(cheek_cfg["eyelidToMouthCornerFraction"]) * (mouth - eyelid)
        centre = centre + float(cheek_cfg["towardFaceEdgeFraction"]) * (edge - centre)
        semi_axes = (
            face_width * float(cheek_cfg["semiAxisWidthFactor"]),
            face_width * float(cheek_cfg["semiAxisHeightFactor"]),
        )
        polygon = _ellipse_polygon(centre, semi_axes, angle, int(cheek_cfg["polygonVertices"]))
        polygon[:, 0] = np.clip(polygon[:, 0], 0, width - 1)
        polygon[:, 1] = np.clip(polygon[:, 1], 0, height - 1)
        rois.append(
            RegionOfInterest(
                name=name,
                polygon=polygon,
                mask=_mask_from_polygon((height, width), polygon),
            )
        )

    return rois
