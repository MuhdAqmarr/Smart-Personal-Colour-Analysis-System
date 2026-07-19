"""Per-IP rate limiting (slowapi).

The expensive analysis endpoints are decorated with the configurable
`settings.rate_limit` (default "10/minute"). Limits are stored in memory,
which is appropriate for the single-instance Render deployment; a shared
store (e.g. Redis) is documented as future work for horizontal scaling.
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.requests import Request
from starlette.responses import JSONResponse

limiter = Limiter(key_func=get_remote_address)


def rate_limit_exceeded_handler(request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, RateLimitExceeded):  # pragma: no cover - slowapi contract
        raise exc
    request_id = getattr(request.state, "request_id", None)
    body: dict[str, object] = {
        "error": {
            "code": "RATE_LIMITED",
            "message": "Too many requests. Please slow down and try again shortly.",
            "details": {"limit": str(exc.detail)},
        }
    }
    if request_id:
        body["error"]["requestId"] = request_id  # type: ignore[index]
    return JSONResponse(status_code=429, content=body)
