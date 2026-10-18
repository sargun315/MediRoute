"""Password hashing and short-lived access-token helpers."""

import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from pwdlib import PasswordHash
from jwt import InvalidTokenError

from app.core.config import get_settings

JWT_ALGORITHM = "HS256"
JWT_ISSUER = "mediroute-api"
password_hasher = PasswordHash.recommended()
# Equalize the expensive password verification path for unknown email addresses.
DUMMY_PASSWORD_HASH = password_hasher.hash("not-a-real-user-password")


def hash_password(password: str) -> str:
    """Hash a password with the recommended Argon2 configuration."""
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Return false for malformed hashes rather than leaking an internal error."""
    try:
        return password_hasher.verify(password, password_hash)
    except Exception:  # Invalid/corrupt stored hashes must fail authentication.
        return False


def _signing_key() -> str:
    key = get_settings().app_secret_key.get_secret_value()
    if len(key) < 32:
        raise RuntimeError("APP_SECRET_KEY must be configured with at least 32 characters.")
    return key


def create_access_token(user_id: UUID) -> tuple[str, int]:
    settings = get_settings()
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(minutes=settings.access_token_expire_minutes)
    claims = {
        "sub": str(user_id),
        "iss": JWT_ISSUER,
        "iat": issued_at,
        "exp": expires_at,
        "jti": secrets.token_urlsafe(18),
        "token_type": "access",
    }
    return jwt.encode(claims, _signing_key(), algorithm=JWT_ALGORITHM), settings.access_token_expire_minutes * 60


def decode_access_token(encoded_token: str) -> UUID:
    """Verify signature, algorithm, issuer, required claims, and expiration."""
    claims = jwt.decode(
        encoded_token,
        _signing_key(),
        algorithms=[JWT_ALGORITHM],
        issuer=JWT_ISSUER,
        options={"require": ["sub", "iss", "iat", "exp", "jti", "token_type"]},
    )
    if claims.get("token_type") != "access":
        raise InvalidTokenError("Wrong token type.")
    try:
        return UUID(claims["sub"])
    except (ValueError, TypeError, KeyError) as exc:
        raise InvalidTokenError("Invalid subject.") from exc
