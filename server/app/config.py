import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _bool(name, default="True"):
    return os.environ.get(name, default).strip().lower() in ("1", "true", "yes", "on")


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me-too")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Comma-separated list, e.g. "http://localhost:5173,https://safariadv.com".
    # Consumed in app/__init__.py when initializing flask-cors.
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 86400))
    )

    MAIL_SERVER = os.environ.get("MAIL_SERVER")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = _bool("MAIL_USE_TLS")
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    # Falls back to MAIL_USERNAME so mail still works if this isn't set.
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER") or os.environ.get(
        "MAIL_USERNAME"
    )

    # Used to build the link inside the password-reset email.
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    MIN_PASSWORD_LENGTH = int(os.environ.get("MIN_PASSWORD_LENGTH", 8))
    RESET_TOKEN_MAX_AGE = int(os.environ.get("RESET_TOKEN_MAX_AGE", 3600))

    # Read by seed.py to create the first admin account.
    ADMIN_NAME = os.environ.get("ADMIN_NAME", "Site Admin")
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@safariadv.com")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "changeme123")

    # --- M-Pesa Daraja (STK Push) ---
    # "sandbox" or "production" - see app/utils/daraja.py for the base URLs.
    MPESA_ENV = os.environ.get("MPESA_ENV", "sandbox")
    MPESA_CONSUMER_KEY = os.environ.get("MPESA_CONSUMER_KEY", "")
    MPESA_CONSUMER_SECRET = os.environ.get("MPESA_CONSUMER_SECRET", "")
    # Safaricom's published sandbox test shortcode/passkey by default, so
    # STK pushes work against the sandbox without any setup. Production
    # MUST override both with your own Paybill/Till + passkey.
    MPESA_SHORTCODE = os.environ.get("MPESA_SHORTCODE", "174379")
    MPESA_PASSKEY = os.environ.get(
        "MPESA_PASSKEY",
        "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    )
    MPESA_TRANSACTION_TYPE = os.environ.get(
        "MPESA_TRANSACTION_TYPE", "CustomerPayBillOnline"
    )
    # Public URL Safaricom POSTs the payment result to - see
    # routes/payments.py:mpesa_callback. Must be reachable from the
    # internet (a local backend needs a tunnel, e.g. ngrok, in dev).
    MPESA_CALLBACK_URL = os.environ.get("MPESA_CALLBACK_URL", "")