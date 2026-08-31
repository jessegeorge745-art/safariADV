"""
app/utils/decorators.py — role_required(...)

    @role_required("agent")
    def create_trip_package():
        ...

Wraps a route function. Before the function runs, it:
  1. Verifies the JWT is present and valid
  2. Reloads the user from the database (not just trusting the token)
  3. Checks user.status == "active" and user.role matches one of the
     roles passed in

Reloading from the database on every request (step 2) is why deactivating
a user or changing their role takes effect immediately — even on a token
that was issued five minutes ago and hasn't expired yet.

The loaded user is stashed on flask.g.current_user so the route function
doesn't have to look it up again.
"""

from functools import wraps

from flask import g, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from app.models import User


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()

            user = User.query.get(int(user_id)) if user_id is not None else None
            if user is None:
                return jsonify({"error": "User not found."}), 401

            if user.status != "active":
                return jsonify({"error": "Your account is not active."}), 403

            if roles and user.role not in roles:
                return jsonify({"error": "You do not have permission to do that."}), 403

            g.current_user = user
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def login_required(fn):
    """Like role_required but allows any role, as long as the account is active."""
    return role_required()(fn)