"""Landmark anchors and head-pose extraction.

Anchor indices refer to the MediaPipe Face Mesh topology (478 points).
Only geometrically stable, well-documented anchors are used; regions are
always constructed relative to these anchors, never as fixed pixel boxes.
"""

from __future__ import annotations

import math

import numpy as np

from app.analysis.types import FaceData, PoseAngles

# Canonical MediaPipe Face Mesh anchor indices.
FACE_OVAL_TOP = 10  # top of the forehead at the face oval
CHIN_BOTTOM = 152
GLABELLA = 9  # between the eyebrows
NOSE_TIP = 1
LEFT_FACE_EDGE = 454  # subject's left (image right)
RIGHT_FACE_EDGE = 234  # subject's right (image left)
LEFT_EYE_OUTER = 263
RIGHT_EYE_OUTER = 33
LEFT_EYE_LOWER = 374  # bottom of subject-left lower eyelid
RIGHT_EYE_LOWER = 145
LEFT_MOUTH_CORNER = 291
RIGHT_MOUTH_CORNER = 61


def anchor(face: FaceData, index: int) -> np.ndarray:
    """Pixel-space (x, y) for a landmark index."""
    return np.asarray(face.landmarks_px[index])


def interocular_distance(face: FaceData) -> float:
    return float(np.linalg.norm(anchor(face, LEFT_EYE_OUTER) - anchor(face, RIGHT_EYE_OUTER)))


def face_width(face: FaceData) -> float:
    return float(np.linalg.norm(anchor(face, LEFT_FACE_EDGE) - anchor(face, RIGHT_FACE_EDGE)))


def extract_pose(face: FaceData) -> PoseAngles:
    """Head pose (yaw/pitch/roll, degrees) from the facial transformation
    matrix.

    The matrix maps the canonical face model into camera space; its upper
    3×3 block is a rotation. Decomposition convention (documented for the
    FYP report): yaw about the vertical axis (left/right turn), pitch about
    the horizontal axis (up/down nod), roll in the image plane (tilt).
    A perfectly frontal face yields angles near zero.
    """
    if face.transform is None:
        # Fall back to a symmetric-geometry roll estimate; yaw/pitch unknown.
        left = anchor(face, LEFT_EYE_OUTER)
        right = anchor(face, RIGHT_EYE_OUTER)
        roll = math.degrees(math.atan2(left[1] - right[1], left[0] - right[0]))
        return PoseAngles(yaw_degrees=0.0, pitch_degrees=0.0, roll_degrees=roll)

    rotation = face.transform[:3, :3]
    # Normalise scale out of the rotation columns.
    scale = np.linalg.norm(rotation, axis=0)
    scale[scale == 0] = 1.0
    r = rotation / scale

    sin_yaw = float(np.clip(-r[2, 0], -1.0, 1.0))
    yaw = math.asin(sin_yaw)
    if abs(sin_yaw) < 0.99999:
        pitch = math.atan2(r[2, 1], r[2, 2])
        roll = math.atan2(r[1, 0], r[0, 0])
    else:  # pragma: no cover - gimbal lock, unreachable for usable photos
        pitch = math.atan2(-r[1, 2], r[1, 1])
        roll = 0.0

    return PoseAngles(
        yaw_degrees=math.degrees(yaw),
        pitch_degrees=math.degrees(pitch),
        roll_degrees=math.degrees(roll),
    )
