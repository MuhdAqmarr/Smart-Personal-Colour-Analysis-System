"""Supabase JWT verification.

Supports both signing schemes Supabase projects use:
  * legacy shared-secret HS256 (SUPABASE_JWT_SECRET), and
  * asymmetric signing keys (RS256/ES256) verified against the project's
    JWKS endpoint `<SUPABASE_URL>/auth/v1/.well-known/jwks.json` (cached).

Tokens must carry the `authenticated` audience, an expiry, and a `sub` claim.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any
from uuid import UUID

import jwt as pyjwt
from jwt import PyJWKClient

from app.core.config import Settings
from app.core.errors import UnauthenticatedError

_ALLOWED_ASYMMETRIC = ("RS256", "ES256")
AUDIENCE = "authenticated"


@dataclass(frozen=True)
class TokenClaims:
    user_id: UUID
    email: str | None
    raw: dict[str, Any]


@lru_cache(maxsize=4)
def _jwks_client(jwks_url: str) -> PyJWKClient:
    return PyJWKClient(jwks_url, cache_keys=True, lifespan=300)


def verify_supabase_jwt(token: str, settings: Settings) -> TokenClaims:
    """Verify signature, expiry, and audience; return the token claims."""
    try:
        header = pyjwt.get_unverified_header(token)
    except pyjwt.PyJWTError as exc:
        raise UnauthenticatedError("The access token is malformed.") from exc

    algorithm = header.get("alg")

    try:
        if algorithm == "HS256":
            if not settings.supabase_jwt_secret:
                raise UnauthenticatedError("This server is not configured for HS256 tokens.")
            payload = pyjwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience=AUDIENCE,
                options={"require": ["exp", "sub"]},
            )
        elif algorithm in _ALLOWED_ASYMMETRIC:
            if not settings.supabase_url:
                raise UnauthenticatedError("This server is not configured for JWKS verification.")
            jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
            signing_key = _jwks_client(jwks_url).get_signing_key_from_jwt(token)
            payload = pyjwt.decode(
                token,
                signing_key.key,
                algorithms=list(_ALLOWED_ASYMMETRIC),
                audience=AUDIENCE,
                options={"require": ["exp", "sub"]},
            )
        else:
            raise UnauthenticatedError("The access token uses an unsupported algorithm.")
    except pyjwt.ExpiredSignatureError as exc:
        raise UnauthenticatedError("The session has expired. Please sign in again.") from exc
    except pyjwt.InvalidAudienceError as exc:
        raise UnauthenticatedError("The access token audience is invalid.") from exc
    except pyjwt.PyJWTError as exc:
        raise UnauthenticatedError("The access token could not be verified.") from exc

    try:
        user_id = UUID(str(payload["sub"]))
    except (KeyError, ValueError) as exc:
        raise UnauthenticatedError("The access token subject is invalid.") from exc

    email = payload.get("email")
    return TokenClaims(
        user_id=user_id, email=email if isinstance(email, str) else None, raw=payload
    )
