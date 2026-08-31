from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone


SESSION_COOKIE = "dashboard_session"
ALL_FEATURES = [
    "overview",
    "positions",
    "portfolioMonitor",
    "logs",
]


def hash_password(password: str, *, salt: bytes | None = None) -> str:
    if not password:
        raise ValueError("password is required")
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return f"pbkdf2_sha256$310000${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (TypeError, ValueError):
        return False


def new_session(days: int) -> tuple[str, str, str]:
    token = secrets.token_urlsafe(48)
    token_hash = hash_session_token(token)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    return token, token_hash, expires_at


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def public_user(user: dict) -> dict:
    features = (
        ALL_FEATURES
        if user.get("role") == "admin"
        else [feature for feature in user.get("features", []) if feature in ALL_FEATURES]
    )
    strategies = [] if user.get("role") == "admin" else user.get("strategies", [])
    return {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "features": features,
        "strategies": strategies,
        "active": bool(user.get("active", True)),
    }
