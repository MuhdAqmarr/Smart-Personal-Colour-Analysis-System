"""MediaPipe Face Landmarker wrapper.

The landmarker is loaded lazily as a process-wide singleton (model bytes are
vendored at apps/api/models/face_landmarker.task, Apache-2.0). Landmarks are
used exclusively to locate geometry — never for identification.
"""

from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Any

import numpy as np

from app.analysis.types import FaceData

_MAX_FACES = 4  # enough to distinguish "one face" from "several faces"

_lock = threading.Lock()
_landmarker: Any | None = None


def default_model_path() -> Path:
    env_path = os.environ.get("FACE_LANDMARKER_MODEL_PATH")
    if env_path:
        return Path(env_path)
    # apps/api/models/face_landmarker.task relative to this file.
    return Path(__file__).resolve().parents[3] / "models" / "face_landmarker.task"


class FaceLandmarkerUnavailableError(RuntimeError):
    """Raised when the model file or MediaPipe runtime is missing."""


def _get_landmarker() -> Any:
    global _landmarker
    if _landmarker is not None:
        return _landmarker
    with _lock:
        if _landmarker is not None:  # pragma: no cover - double-checked lock
            return _landmarker

        model_path = default_model_path()
        if not model_path.exists():
            raise FaceLandmarkerUnavailableError(
                f"Face landmarker model not found at {model_path}. "
                "Restore apps/api/models/face_landmarker.task or set "
                "FACE_LANDMARKER_MODEL_PATH."
            )
        try:
            from mediapipe.tasks import python as mp_python
            from mediapipe.tasks.python import vision as mp_vision
        except ImportError as exc:  # pragma: no cover - dependency is pinned
            raise FaceLandmarkerUnavailableError(
                "MediaPipe is not installed in this environment."
            ) from exc

        options = mp_vision.FaceLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=str(model_path)),
            running_mode=mp_vision.RunningMode.IMAGE,
            num_faces=_MAX_FACES,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=True,
        )
        _landmarker = mp_vision.FaceLandmarker.create_from_options(options)
        return _landmarker


def detect_faces(rgb: np.ndarray) -> list[FaceData]:
    """Detect up to four faces and return landmark/pose data for each."""
    import mediapipe as mp

    landmarker = _get_landmarker()
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb))

    with _lock:  # the tasks API is not re-entrant
        result = landmarker.detect(mp_image)

    height, width = rgb.shape[:2]
    faces: list[FaceData] = []
    for index, landmarks in enumerate(result.face_landmarks):
        norm = np.array([[point.x, point.y, point.z] for point in landmarks], dtype=np.float32)
        pixels = np.stack([norm[:, 0] * width, norm[:, 1] * height], axis=1).astype(np.float32)
        x0 = float(np.min(pixels[:, 0]))
        y0 = float(np.min(pixels[:, 1]))
        x1 = float(np.max(pixels[:, 0]))
        y1 = float(np.max(pixels[:, 1]))

        transform: np.ndarray | None = None
        matrixes = getattr(result, "facial_transformation_matrixes", None)
        if matrixes and index < len(matrixes):
            transform = np.array(matrixes[index], dtype=np.float64).reshape(4, 4)

        faces.append(
            FaceData(
                landmarks_px=pixels,
                landmarks_norm=norm,
                transform=transform,
                bbox=(x0, y0, x1, y1),
            )
        )
    return faces
