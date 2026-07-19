from __future__ import annotations

import httpx
import pytest
from app.core.errors import (
    AnalysisRejectedError,
    AppError,
    ForbiddenError,
    NotFoundError,
    UnauthenticatedError,
)


async def test_unknown_route_returns_error_envelope(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/definitely-not-a-route")
    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "NOT_FOUND"
    assert body["error"]["message"]
    assert body["error"]["requestId"]


async def test_method_not_allowed_uses_envelope(client: httpx.AsyncClient) -> None:
    response = await client.post("/api/v1/health")
    assert response.status_code == 405
    assert response.json()["error"]["code"] == "METHOD_NOT_ALLOWED"


def test_app_error_hierarchy_defaults() -> None:
    assert UnauthenticatedError().status_code == 401
    assert ForbiddenError().status_code == 403
    assert NotFoundError().status_code == 404
    assert AppError().code == "INTERNAL_ERROR"


def test_analysis_rejected_error_carries_specific_code() -> None:
    error = AnalysisRejectedError(
        "The image is too dark for a reliable colour analysis.",
        code="IMAGE_TOO_DARK",
        details={"brightnessScore": 0.31},
    )
    assert error.code == "IMAGE_TOO_DARK"
    assert error.status_code == 422
    assert error.details == {"brightnessScore": 0.31}


@pytest.mark.parametrize(
    ("error", "expected_code"),
    [
        (UnauthenticatedError(), "UNAUTHENTICATED"),
        (ForbiddenError(), "FORBIDDEN"),
        (NotFoundError(), "NOT_FOUND"),
    ],
)
def test_error_codes_are_stable(error: AppError, expected_code: str) -> None:
    assert error.code == expected_code
