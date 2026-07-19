from __future__ import annotations

import numpy as np
import pytest
from app.analysis.preprocessing.validation import (
    UploadLimits,
    sniff_format,
    validate_and_decode,
)
from app.core.errors import (
    AnalysisRejectedError,
    PayloadTooLargeError,
    UnsupportedMediaTypeError,
)
from PIL import Image

from tests.fixtures import encode, valid_face_bytes

LIMITS = UploadLimits(
    max_bytes=10 * 1024 * 1024,
    max_decoded_pixels=50_000_000,
    min_edge_pixels=320,
    max_analysis_edge_pixels=1600,
    allowed_formats=("jpeg", "png", "webp"),
)


def test_sniffs_jpeg_png_webp() -> None:
    array = np.full((16, 16, 3), 128, dtype=np.uint8)
    assert sniff_format(encode(array, "JPEG")) == "jpeg"
    assert sniff_format(encode(array, "PNG")) == "png"
    assert sniff_format(encode(array, "WEBP")) == "webp"
    assert sniff_format(b"GIF89a....") is None
    assert sniff_format(b"") is None


def test_decodes_valid_jpeg() -> None:
    image = validate_and_decode(
        valid_face_bytes(640),
        declared_mime="image/jpeg",
        filename="face.jpg",
        limits=LIMITS,
    )
    assert image.format == "jpeg"
    assert image.width == 640
    assert image.rgb.shape == (640, 640, 3)
    assert image.rgb.dtype == np.uint8


def test_rejects_empty_payload() -> None:
    with pytest.raises(AnalysisRejectedError) as excinfo:
        validate_and_decode(b"", declared_mime=None, filename=None, limits=LIMITS)
    assert excinfo.value.code == "IMAGE_DECODE_FAILED"


def test_rejects_oversized_payload() -> None:
    small_limits = UploadLimits(
        max_bytes=1000,
        max_decoded_pixels=LIMITS.max_decoded_pixels,
        min_edge_pixels=LIMITS.min_edge_pixels,
        max_analysis_edge_pixels=LIMITS.max_analysis_edge_pixels,
        allowed_formats=LIMITS.allowed_formats,
    )
    with pytest.raises(PayloadTooLargeError):
        validate_and_decode(
            valid_face_bytes(640), declared_mime="image/jpeg", filename="a.jpg", limits=small_limits
        )


def test_rejects_unsupported_format() -> None:
    with pytest.raises(UnsupportedMediaTypeError):
        validate_and_decode(
            b"GIF89a" + b"\x00" * 64, declared_mime="image/gif", filename="a.gif", limits=LIMITS
        )


def test_rejects_mime_content_mismatch() -> None:
    with pytest.raises(UnsupportedMediaTypeError) as excinfo:
        validate_and_decode(
            valid_face_bytes(640),
            declared_mime="image/png",  # actually JPEG bytes
            filename="face.jpg",
            limits=LIMITS,
        )
    assert "does not match" in str(excinfo.value)


def test_rejects_extension_content_mismatch() -> None:
    with pytest.raises(UnsupportedMediaTypeError):
        validate_and_decode(
            valid_face_bytes(640),
            declared_mime="image/jpeg",
            filename="face.png",  # JPEG bytes with PNG extension
            limits=LIMITS,
        )


def test_rejects_truncated_jpeg() -> None:
    data = valid_face_bytes(640)[:200]
    with pytest.raises(AnalysisRejectedError) as excinfo:
        validate_and_decode(data, declared_mime="image/jpeg", filename="a.jpg", limits=LIMITS)
    assert excinfo.value.code == "IMAGE_DECODE_FAILED"


def test_rejects_too_small_image() -> None:
    tiny = encode(np.full((64, 64, 3), 100, dtype=np.uint8))
    with pytest.raises(AnalysisRejectedError) as excinfo:
        validate_and_decode(tiny, declared_mime="image/jpeg", filename="a.jpg", limits=LIMITS)
    assert excinfo.value.code == "IMAGE_TOO_SMALL"


def test_rejects_decompression_bomb_dimensions() -> None:
    # 1×50M-ish PNG header would exceed the pixel ceiling; use a modest cap
    # to keep the test fast.
    bomb_limits = UploadLimits(
        max_bytes=LIMITS.max_bytes,
        max_decoded_pixels=400 * 400,
        min_edge_pixels=64,
        max_analysis_edge_pixels=1600,
        allowed_formats=LIMITS.allowed_formats,
    )
    big = encode(np.full((640, 640, 3), 90, dtype=np.uint8), "PNG")
    with pytest.raises(AnalysisRejectedError) as excinfo:
        validate_and_decode(big, declared_mime="image/png", filename="a.png", limits=bomb_limits)
    assert excinfo.value.code == "IMAGE_TOO_LARGE"


def test_resizes_to_max_edge_preserving_aspect() -> None:
    wide = np.zeros((900, 3000, 3), dtype=np.uint8)
    image = validate_and_decode(
        encode(wide), declared_mime="image/jpeg", filename="wide.jpg", limits=LIMITS
    )
    assert image.width == 1600
    assert image.height == round(900 * (1600 / 3000))
    assert image.original_width == 3000


def test_applies_exif_orientation() -> None:
    # Encode a tall gradient rotated via EXIF orientation 6 (90° CW).
    base = np.zeros((400, 600, 3), dtype=np.uint8)
    base[:, :300] = 250  # left half bright
    pil = Image.fromarray(base)
    from io import BytesIO

    buffer = BytesIO()
    exif = pil.getexif()
    exif[274] = 6  # orientation tag
    pil.save(buffer, format="JPEG", exif=exif.tobytes(), quality=95)

    image = validate_and_decode(
        buffer.getvalue(), declared_mime="image/jpeg", filename="r.jpg", limits=LIMITS
    )
    # Orientation 6 rotates: 600×400 → 400×600.
    assert (image.width, image.height) == (400, 600)
