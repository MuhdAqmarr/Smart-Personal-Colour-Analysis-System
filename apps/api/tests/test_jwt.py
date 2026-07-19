from __future__ import annotations

import time
import uuid
from typing import Any

import jwt as pyjwt
import pytest
from app.core.config import Settings
from app.core.errors import UnauthenticatedError
from app.security.jwt import AUDIENCE, verify_supabase_jwt

SECRET = "unit-test-secret"


def settings_with_secret(**overrides: Any) -> Settings:
    return Settings(
        app_env="test",
        supabase_jwt_secret=SECRET,
        _env_file=None,
        **overrides,
    )


def mint(
    *,
    sub: str | None = None,
    audience: str = AUDIENCE,
    expires_in: int = 3600,
    secret: str = SECRET,
    email: str | None = "person@example.com",
) -> str:
    payload: dict[str, Any] = {
        "aud": audience,
        "exp": int(time.time()) + expires_in,
        "iat": int(time.time()) - 5,
        "role": "authenticated",
    }
    if sub is not None:
        payload["sub"] = sub
    if email is not None:
        payload["email"] = email
    return pyjwt.encode(payload, secret, algorithm="HS256")


def test_valid_hs256_token_returns_claims() -> None:
    user_id = str(uuid.uuid4())
    claims = verify_supabase_jwt(mint(sub=user_id), settings_with_secret())
    assert str(claims.user_id) == user_id
    assert claims.email == "person@example.com"
    assert claims.raw["role"] == "authenticated"


def test_expired_token_rejected() -> None:
    token = mint(sub=str(uuid.uuid4()), expires_in=-60)
    with pytest.raises(UnauthenticatedError, match="expired"):
        verify_supabase_jwt(token, settings_with_secret())


def test_wrong_audience_rejected() -> None:
    token = mint(sub=str(uuid.uuid4()), audience="anon")
    with pytest.raises(UnauthenticatedError, match="audience"):
        verify_supabase_jwt(token, settings_with_secret())


def test_wrong_secret_rejected() -> None:
    token = mint(sub=str(uuid.uuid4()), secret="a-different-secret")
    with pytest.raises(UnauthenticatedError, match="verified"):
        verify_supabase_jwt(token, settings_with_secret())


def test_missing_subject_rejected() -> None:
    token = mint(sub=None)
    with pytest.raises(UnauthenticatedError):
        verify_supabase_jwt(token, settings_with_secret())


def test_non_uuid_subject_rejected() -> None:
    token = mint(sub="not-a-uuid")
    with pytest.raises(UnauthenticatedError, match="subject"):
        verify_supabase_jwt(token, settings_with_secret())


def test_garbage_token_rejected() -> None:
    with pytest.raises(UnauthenticatedError, match="malformed"):
        verify_supabase_jwt("definitely.not.a-jwt", settings_with_secret())


def test_hs256_without_configured_secret_rejected() -> None:
    token = mint(sub=str(uuid.uuid4()))
    settings = Settings(app_env="test", supabase_jwt_secret="", _env_file=None)
    with pytest.raises(UnauthenticatedError, match="not configured"):
        verify_supabase_jwt(token, settings)


def test_unsupported_algorithm_rejected() -> None:
    token = pyjwt.encode(
        {"sub": str(uuid.uuid4()), "aud": AUDIENCE, "exp": int(time.time()) + 60},
        SECRET,
        algorithm="HS512",
    )
    with pytest.raises(UnauthenticatedError, match="unsupported algorithm"):
        verify_supabase_jwt(token, settings_with_secret())


def test_es256_token_verified_via_jwks(monkeypatch: pytest.MonkeyPatch) -> None:
    ec = pytest.importorskip("cryptography.hazmat.primitives.asymmetric.ec")
    from cryptography.hazmat.primitives.asymmetric.ec import SECP256R1, generate_private_key

    private_key = generate_private_key(SECP256R1())
    user_id = str(uuid.uuid4())
    token = pyjwt.encode(
        {
            "sub": user_id,
            "aud": AUDIENCE,
            "exp": int(time.time()) + 600,
            "email": "es256@example.com",
        },
        private_key,
        algorithm="ES256",
        headers={"kid": "test-key"},
    )

    class FakeSigningKey:
        key = private_key.public_key()

    class FakeJwksClient:
        def get_signing_key_from_jwt(self, _token: str) -> FakeSigningKey:
            return FakeSigningKey()

    monkeypatch.setattr("app.security.jwt._jwks_client", lambda _url: FakeJwksClient())
    settings = Settings(
        app_env="test",
        supabase_url="https://example.supabase.co",
        supabase_jwt_secret="",
        _env_file=None,
    )
    claims = verify_supabase_jwt(token, settings)
    assert str(claims.user_id) == user_id
    assert claims.email == "es256@example.com"
    assert ec is not None
