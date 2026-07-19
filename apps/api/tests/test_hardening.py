"""Security-hardening behaviours: log hygiene and rate limiting."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator

import httpx
import pytest

from tests import fixtures


@pytest.fixture
async def limited_client(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncIterator[httpx.AsyncClient]:
    """App with an aggressive rate limit and its own limiter storage."""
    monkeypatch.setenv("RATE_LIMIT", "3/minute")
    from app.core.classifier import get_classifier_config
    from app.core.config import get_settings
    from app.security.rate_limit import limiter

    get_settings.cache_clear()
    get_classifier_config.cache_clear()
    limiter.reset()

    from app.main import create_app

    app = create_app()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client

    limiter.reset()
    get_settings.cache_clear()
    get_classifier_config.cache_clear()
    monkeypatch.setenv("RATE_LIMIT", os.environ.get("RATE_LIMIT", "1000/minute"))


@pytest.mark.landmarker
async def test_rate_limit_returns_structured_429(limited_client: httpx.AsyncClient) -> None:
    payload = fixtures.flat_gray_bytes()
    responses = []
    for _ in range(4):
        response = await limited_client.post(
            "/api/v1/analyses/preview-quality",
            files={"image": ("gray.jpg", payload, "image/jpeg")},
        )
        responses.append(response)
    assert responses[-1].status_code == 429
    body = responses[-1].json()
    assert body["error"]["code"] == "RATE_LIMITED"
    assert body["error"]["message"]


@pytest.mark.landmarker
async def test_logs_never_contain_image_bytes_or_tokens(
    client: httpx.AsyncClient, capsys: pytest.CaptureFixture[str]
) -> None:
    """Structured logs must not leak upload bytes or bearer tokens."""
    image_bytes = fixtures.valid_face_bytes()
    fake_token = "supersecret-token-value-abc123xyz"

    await client.post(
        "/api/v1/analyses",
        files={"image": ("face.jpg", image_bytes, "image/jpeg")},
        headers={"Authorization": f"Bearer {fake_token}"},
    )

    captured = capsys.readouterr().out
    assert "request_completed" in captured  # access log did fire
    assert fake_token not in captured
    # No raw image payload fragments (JPEG start-of-image marker as text or
    # base64 blobs of meaningful length).
    assert "\\xff\\xd8" not in captured
    assert image_bytes[:32].hex() not in captured
    for line in captured.splitlines():
        assert len(line) < 2000, "suspiciously large log line (possible payload leak)"


async def test_error_envelope_hides_internals(client: httpx.AsyncClient) -> None:
    """Unexpected errors must not leak stack traces to clients."""
    # Malformed multipart triggers the framework error path.
    response = await client.post(
        "/api/v1/analyses/preview-quality",
        content=b"not-multipart",
        headers={"Content-Type": "multipart/form-data; boundary=broken"},
    )
    assert response.status_code in (400, 422)
    body = response.json()
    assert "error" in body
    assert "Traceback" not in response.text
    assert ".py" not in response.text


async def test_cors_rejects_unknown_origins(client: httpx.AsyncClient) -> None:
    response = await client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert (
        "access-control-allow-origin" not in {key.lower() for key in response.headers}
        or response.headers.get("access-control-allow-origin") != "https://evil.example"
    )


async def test_cors_allows_configured_frontend(client: httpx.AsyncClient) -> None:
    response = await client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
