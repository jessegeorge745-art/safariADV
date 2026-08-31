"""
app/utils/tokens.py — password reset tokens.

Generates a signed, time-limited token (via itsdangerous) for the
forgot-password flow. The token expires after RESET_TOKEN_EXPIRES_MINUTES
even if never used — that setting lives in app/config.py, change it there.
"""

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import current_app

RESET_SALT = "password-reset"


def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])


def generate_reset_token(user_email):
    return _serializer().dumps(user_email, salt=RESET_SALT)


def verify_reset_token(token):
    """Returns the email the token was issued for, or None if invalid/expired."""
    expires_in_seconds = current_app.config["RESET_TOKEN_EXPIRES_MINUTES"] * 60
    try:
        return _serializer().loads(token, salt=RESET_SALT, max_age=expires_in_seconds)
    except (BadSignature, SignatureExpired):
        return None