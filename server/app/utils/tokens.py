from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import current_app

_SALT = "password-reset-salt"


def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])


def generate_reset_token(email):
    """Signed token encoding the user's email. Expires after RESET_TOKEN_MAX_AGE
    seconds even if never used - check that config value to change the window."""
    return _serializer().dumps(email, salt=_SALT)


def verify_reset_token(token):
    """Returns the email if the token is valid and unexpired, else None."""
    max_age = current_app.config.get("RESET_TOKEN_MAX_AGE", 3600)
    try:
        return _serializer().loads(token, salt=_SALT, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
