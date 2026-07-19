"""Endpoint tests for POST /api/v1/analyses/preview-quality."""

from __future__ import annotations

import httpx
import pytest

from tests import fixtures

pytestmark = pytest.mark.landmarker


async def post_image(
    client: httpx.AsyncClient, data: bytes, filename: str = "face.jpg", mime: str = "image/jpeg"
) -> httpx.Response:
    return await client.post(
        "/api/v1/analyses/preview-quality",
        files={"image": (filename, data, mime)},
    )


async def test_valid_face_returns_acceptable_report(client: httpx.AsyncClient) -> None:
    response = await post_image(client, fixtures.valid_face_bytes())
    assert response.status_code == 200
    body = response.json()
    assert body["acceptable"] is True
    assert body["overallScore"] >= 55
    assert set(body["components"]) == {
        "faceDetection",
        "faceSize",
        "pose",
        "sharpness",
        "exposure",
        "lightingConsistency",
        "colourCast",
        "usableSkinArea",
    }
    assert body["exposureStatus"] == "acceptable"
    assert body["colourCast"] == "none"
    assert "yawDegrees" in body["pose"]


async def test_no_face_returns_error_envelope(client: httpx.AsyncClient) -> None:
    response = await post_image(client, fixtures.no_face_bytes())
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "NO_FACE_DETECTED"
    assert body["error"]["requestId"]


async def test_multiple_faces_returns_error(client: httpx.AsyncClient) -> None:
    response = await post_image(client, fixtures.multiple_faces_bytes())
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "MULTIPLE_FACES_DETECTED"


async def test_unsupported_format_rejected(client: httpx.AsyncClient) -> None:
    response = await post_image(client, b"GIF89a" + b"\x00" * 100, "a.gif", "image/gif")
    assert response.status_code == 415
    assert response.json()["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"


async def test_blurred_image_reports_not_acceptable(client: httpx.AsyncClient) -> None:
    response = await post_image(client, fixtures.blurred_face_bytes())
    assert response.status_code == 200
    body = response.json()
    assert body["acceptable"] is False
    codes = {issue["code"] for issue in body["issues"]}
    assert "IMAGE_TOO_BLURRY" in codes
    assert body["retakeTips"]


async def test_missing_file_is_validation_error(client: httpx.AsyncClient) -> None:
    response = await client.post("/api/v1/analyses/preview-quality")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
