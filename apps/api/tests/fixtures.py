"""Licence-clean test image generators.

The canonical valid face is scikit-image's bundled `astronaut` photograph
(Eileen Collins, a NASA image in the public domain). Degraded variants are
derived programmatically so the whole suite is hermetic — no downloads, no
scraped photos, no consent issues. See test-assets/README.md.
"""

from __future__ import annotations

from functools import lru_cache
from io import BytesIO

import numpy as np
from PIL import Image, ImageFilter


@lru_cache(maxsize=1)
def astronaut() -> np.ndarray:
    from skimage import data

    return np.asarray(data.astronaut(), dtype=np.uint8)  # 512×512 RGB


def encode(array: np.ndarray, fmt: str = "JPEG", quality: int = 95) -> bytes:
    image = Image.fromarray(array.astype(np.uint8))
    buffer = BytesIO()
    if fmt.upper() == "JPEG":
        image.save(buffer, format="JPEG", quality=quality)
    else:
        image.save(buffer, format=fmt.upper())
    return buffer.getvalue()


def _upscale(array: np.ndarray, size: int) -> np.ndarray:
    image = Image.fromarray(array).resize((size, size), Image.Resampling.LANCZOS)
    return np.asarray(image, dtype=np.uint8)


def valid_face_bytes(size: int = 640, fmt: str = "JPEG") -> bytes:
    """Front-facing public-domain face, upscaled for comfortable detection."""
    return encode(_upscale(astronaut(), size), fmt=fmt)


def no_face_bytes(size: int = 640) -> bytes:
    """Smooth gradient + deterministic noise — nothing face-like."""
    rng = np.random.default_rng(42)
    y = np.linspace(60, 200, size, dtype=np.float64)[:, None]
    x = np.linspace(40, 160, size, dtype=np.float64)[None, :]
    grid = np.zeros((size, size))
    base = np.stack([grid + y + x * 0.2, grid + y * 0.8 + 40, grid + x + 30], axis=-1)
    noise = rng.normal(0, 8, base.shape)
    return encode(np.clip(base + noise, 0, 255).astype(np.uint8))


def _head_crop(size: int = 512) -> np.ndarray:
    """Close crop of the astronaut's head (measured once; deterministic).

    The vendored landmarker uses a short-range face detector tuned for
    selfies — faces must occupy a substantial share of the frame, so the
    multi-face fixture composites close-cropped heads."""
    full = astronaut()  # 512×512
    crop = full[14:236, 141:310]
    image = Image.fromarray(crop).resize((size, size), Image.Resampling.LANCZOS)
    return np.asarray(image, dtype=np.uint8)


def multiple_faces_bytes(size: int = 512, gap: int = 60) -> bytes:
    """Two close-cropped heads side by side (both detectable)."""
    head = _head_crop(size)
    canvas = np.full((size, size * 2 + gap, 3), 200, dtype=np.uint8)
    canvas[:, :size] = head
    canvas[:, size + gap :] = head[:, ::-1]
    return encode(canvas)


def dark_face_bytes(factor: float = 0.10) -> bytes:
    face = _upscale(astronaut(), 640).astype(np.float64)
    return encode(np.clip(face * factor, 0, 255).astype(np.uint8))


def bright_face_bytes(factor: float = 2.6) -> bytes:
    face = _upscale(astronaut(), 640).astype(np.float64)
    return encode(np.clip(face * factor, 0, 255).astype(np.uint8))


def blurred_face_bytes(radius: float = 4.0) -> bytes:
    face = Image.fromarray(_upscale(astronaut(), 640))
    blurred = face.filter(ImageFilter.GaussianBlur(radius=radius))
    return encode(np.asarray(blurred, dtype=np.uint8))


def colour_cast_bytes(direction: str = "yellow") -> bytes:
    """Astronaut with a strong channel imbalance simulating coloured light."""
    face = _upscale(astronaut(), 640).astype(np.float64)
    gains = {
        "yellow": (1.18, 1.10, 0.55),
        "blue": (0.62, 0.80, 1.35),
        "red": (1.45, 0.85, 0.85),
        "green": (0.80, 1.35, 0.80),
    }[direction]
    for channel, gain in enumerate(gains):
        face[..., channel] *= gain
    return encode(np.clip(face, 0, 255).astype(np.uint8))


def tiny_face_bytes(canvas: int = 1600, face_size: int = 360) -> bytes:
    """Detectable but far-too-small face on a large neutral canvas."""
    background = np.full((canvas, canvas, 3), 210, dtype=np.uint8)
    face = _upscale(astronaut(), face_size)
    offset = (canvas - face_size) // 2
    background[offset : offset + face_size, offset : offset + face_size] = face
    return encode(background)


def rotated_face_bytes(angle_degrees: float = 20.0) -> bytes:
    """In-plane rotated face (tests roll detection)."""
    face = Image.fromarray(_upscale(astronaut(), 640))
    rotated = face.rotate(
        angle_degrees, resample=Image.Resampling.BICUBIC, fillcolor=(200, 200, 200)
    )
    return encode(np.asarray(rotated, dtype=np.uint8))


def flat_gray_bytes(level: int = 128, size: int = 512) -> bytes:
    return encode(np.full((size, size, 3), level, dtype=np.uint8))
