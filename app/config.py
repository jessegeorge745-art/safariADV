"""
app/config.py — settings, read from environment.

Every setting is pulled from an environment variable via os.environ.get(...).
Nothing is hardcoded here. To change a setting, edit .env, not this file.

DATABASE_URL has no fallback on purpose: if it's missing, the app should
fail loudly at startup rather than silently falling back to SQLite and
masking a misconfiguration.
"""

import os
from datetime import timedelta


def _require(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            f"Did you copy .env.example to .env and fill it in?"
        )
    return value


def _bool(name, default="false"):
    return os.environ.get(name, default).strip().lower() in ("1", "true", "yes", "on")


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

    # --- Database -----------------------------------------------------
    SQLALCHEMY_DATABASE_URI = _require("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- JWT ------------------------------------------------------------
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "60"))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30"))
    )

    # --- CORS -------------------------------------------------------------
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]

    # --- Password reset tokens -------------------------------------------
    RESET_TOKEN_EXPIRES_MINUTES = int(os.environ.get("RESET_TOKEN_EXPIRES_MINUTES", "30"))

    # --- First admin (used by seed.py) ------------------------------------
    ADMIN_NAME = os.environ.get("ADMIN_NAME", "Admin")
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "[email protected]")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "changeme123")

    # --- Mail ------------------------------------------------------------
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", "587"))
    MAIL_USE_TLS = _bool("MAIL_USE_TLS", "true")
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "SafariADV <[email protected]>")