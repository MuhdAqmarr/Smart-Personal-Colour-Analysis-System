"""Upload validation, safe decoding, EXIF correction, and resizing.

Security order of operations:
1. size cap (bytes) — before touching the payload;
2. magic-byte sniffing — declared MIME and extension must agree;
3. header-only dimension check — decompression-bomb ceiling BEFORE full
   pixel decode (Pillow parses the header lazily on open());
4. full decode with EXIF orientation applied, converted to RGB;
5. bounded resize (longest edge from configuration).

Uploaded bytes are processed strictly in memory and never written to disk.
"""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Literal

import numpy as np
from PIL import Image, ImageOps

from app.analysis.types import DecodedImage
from app.core.errors import (
    AnalysisRejectedError,
    PayloadTooLargeError,
    UnsupportedMediaTypeError,
)

# We enforce an explicit pixel ceiling ourselves (checked before decode);
# Pillow's global limit stays disabled so the behaviour is deterministic
# and the error message is ours.
Image.MAX_IMAGE_PIXELS = None

SniffedFormat = Literal["jpeg", "png", "webp"]

_MIME_BY_FORMAT: dict[SniffedFormat, str] = {
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
}

_EXTENSIONS_BY_FORMAT: dict[SniffedFormat, tuple[str, ...]] = {
    "jpeg": (".jpg", ".jpeg"),
    "png": (".png",),
    "webp": (".webp",),
}


@dataclass(frozen=True)
class UploadLimits:
    max_bytes: int
    max_decoded_pixels: int
    min_edge_pixels: int
    max_analysis_edge_pixels: int
    allowed_formats: tuple[str, ...]


def sniff_format(data: bytes) -> SniffedFormat | None:
    """Identify the real container from magic bytes."""
    if len(data) >= 3 and data[:3] == b"\xff\xd8\xff":
        return "jpeg"
    if len(data) >= 8 and data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


def validate_and_decode(
    data: bytes,
    *,
    declared_mime: str | None,
    filename: str | None,
    limits: UploadLimits,
) -> DecodedImage:
    """Validate the upload and return a safe, analysis-ready RGB image."""
    if len(data) == 0:
        raise AnalysisRejectedError("The uploaded file is empty.", code="IMAGE_DECODE_FAILED")
    if len(data) > limits.max_bytes:
        raise PayloadTooLargeError(
            f"The image is larger than the {limits.max_bytes // (1024 * 1024)} MB limit.",
            details={"sizeBytes": len(data), "maxBytes": limits.max_bytes},
        )

    detected = sniff_format(data)
    if detected is None or detected not in limits.allowed_formats:
        raise UnsupportedMediaTypeError(
            "Only JPEG, PNG, and WebP images are supported.",
            details={"detectedFormat": detected or "unknown"},
        )

    # The browser-reported type and the extension must not contradict the
    # sniffed content (polyglot / renamed-file defence).
    if declared_mime and declared_mime.lower() not in (
        _MIME_BY_FORMAT[detected],
        "application/octet-stream",
    ):
        raise UnsupportedMediaTypeError(
            "The file content does not match its declared type.",
            details={"declared": declared_mime, "detected": _MIME_BY_FORMAT[detected]},
        )
    if filename:
        lowered = filename.lower()
        has_known_extension = any(
            lowered.endswith(ext) for exts in _EXTENSIONS_BY_FORMAT.values() for ext in exts
        )
        if has_known_extension and not lowered.endswith(_EXTENSIONS_BY_FORMAT[detected]):
            raise UnsupportedMediaTypeError(
                "The file extension does not match the image content.",
                details={"filename": filename, "detected": detected},
            )

    try:
        with Image.open(BytesIO(data)) as opened:
            # Header-only checks before any pixel decode.
            original_width, original_height = opened.size
            if original_width * original_height > limits.max_decoded_pixels:
                raise AnalysisRejectedError(
                    "The image dimensions are too large to process safely.",
                    code="IMAGE_TOO_LARGE",
                    details={
                        "width": original_width,
                        "height": original_height,
                        "maxPixels": limits.max_decoded_pixels,
                    },
                )
            if min(original_width, original_height) < limits.min_edge_pixels:
                raise AnalysisRejectedError(
                    f"The image is too small for reliable analysis — at least "
                    f"{limits.min_edge_pixels}px on the shortest side is required.",
                    code="IMAGE_TOO_SMALL",
                    details={"width": original_width, "height": original_height},
                )

            oriented = ImageOps.exif_transpose(opened)
            if oriented is None:  # pragma: no cover - Pillow returns an image
                oriented = opened
            rgb_image = oriented.convert("RGB")
    except AnalysisRejectedError:
        raise
    except Exception as exc:
        raise AnalysisRejectedError(
            "The file could not be decoded as an image.",
            code="IMAGE_DECODE_FAILED",
        ) from exc

    width, height = rgb_image.size
    longest = max(width, height)
    if longest > limits.max_analysis_edge_pixels:
        scale = limits.max_analysis_edge_pixels / longest
        new_size = (max(1, round(width * scale)), max(1, round(height * scale)))
        rgb_image = rgb_image.resize(new_size, Image.Resampling.LANCZOS)
        width, height = rgb_image.size

    array = np.asarray(rgb_image, dtype=np.uint8)
    return DecodedImage(
        rgb=array,
        width=width,
        height=height,
        original_width=original_width,
        original_height=original_height,
        format=detected,
    )
