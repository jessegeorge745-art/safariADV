from functools import wraps

from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from app.models.user import User


def role_required(*roles):
    """
    Usage:
        @role_required("agent")
        def create_trip_package():
            ...

    Before the wrapped function runs, this:
      1. Verifies the JWT is present and valid.
      2. Reloads the user from the database (not just trusting the token).
      3. Checks user.status == "active" and user.role is one of `roles`.

    Reloading from the database on every request (step 2) is why
    deactivating a user or changing their role takes effect *immediately* -
    even on a token issued five minutes ago that hasn't expired yet.
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id)) if user_id is not None else None

            if user is None:
                return jsonify({"error": "User not found"}), 401

            if user.status != "active":
                return jsonify({"error": "Account is not active"}), 403

            if roles and user.role not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403

            kwargs["current_user"] = user
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def login_required(fn):
    """Any logged-in, active user - regardless of role."""
    return role_required()(fn)
