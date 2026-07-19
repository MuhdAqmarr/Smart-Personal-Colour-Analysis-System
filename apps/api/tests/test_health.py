from __future__ import annotations

import httpx


async def test_health_returns_ok(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["name"] == "coloursense-api"
    assert body["environment"] == "test"
    assert body["version"]


async def test_health_echoes_request_id(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/health", headers={"X-Request-ID": "test-request-0001"})
    assert response.headers["X-Request-ID"] == "test-request-0001"


async def test_health_generates_request_id_for_unsafe_input(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/health", headers={"X-Request-ID": "bad id!"})
    generated = response.headers["X-Request-ID"]
    assert generated != "bad id!"
    assert len(generated) == 32


async def test_readiness_reports_classifier_config(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/readiness")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert body["checks"]["classifier_config"] == "ok"
    assert body["checks"]["database"] == "skipped"


async def test_security_headers_present(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
