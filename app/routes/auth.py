"""
app/routes/auth.py — registration, login, profile.

Key routes:
  POST /api/auth/traveler/register   {name, email, phone, password}
  POST /api/auth/agent/register      {name, email, phone, password, business_name}
  POST /api/auth/traveler/login      {email, password} -> {user, access_token, refresh_token}
  POST /api/auth/agent/login
  POST /api/auth/admin/login
  POST /api/auth/refresh             Authorization: Bearer <refresh_token> -> {user, access_token, refresh_token}
  PUT  /api/auth/me                  update your own name/email/phone/password (any logged-in role)
  POST /api/auth/forgot-password     {email}
  POST /api/auth/reset-password      {token, password}

_validate_password(password) near the top enforces minimum length — that's
the single place to change password rules.

Note on admin: there is deliberately no POST /api/auth/admin/register.
Admins only come from seed.py or from an existing admin promoting a user
via the admin routes.
"""

import re

from flask import Blueprint, request, jsonify, current_app, g
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)

from app.extensions import db
from app.models import User
from app.utils.decorators import login_required
from app.utils.tokens import generate_reset_token, verify_reset_token
from app.utils.mailer import send_password_reset_email

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8


def _validate_password(password):
    if not password or len(password) < MIN_PASSWORD_LENGTH:
        return f"Password must be at least {MIN_PASSWORD_LENGTH} characters."
    return None


def _validate_email(email):
    if not email or not EMAIL_RE.match(email):
        return "Please provide a valid email address."
    return None


def _issue_tokens(user):
    # identity must be a string for flask-jwt-extended >= 4
    additional_claims = {"role": user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)
    return access_token, refresh_token


# ---------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------

@auth_bp.route("/traveler/register", methods=["POST"])
def register_traveler():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip() or None
    password = data.get("password") or ""

    if not name:
        return jsonify({"error": "Name is required."}), 400
    if err := _validate_email(email):
        return jsonify({"error": err}), 400
    if err := _validate_password(password):
        return jsonify({"error": err}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with that email already exists."}), 409

    user = User(name=name, email=email, phone=phone, role="traveler", status="active")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Registration successful. You can now log in.", "user": user.to_dict()}), 201


@auth_bp.route("/agent/register", methods=["POST"])
def register_agent():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip() or None
    password = data.get("password") or ""
    business_name = (data.get("business_name") or "").strip() or None

    if not name:
        return jsonify({"error": "Name is required."}), 400
    if err := _validate_email(email):
        return jsonify({"error": err}), 400
    if err := _validate_password(password):
        return jsonify({"error": err}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with that email already exists."}), 409

    # Agents start "pending" — they can't log in until an admin activates them.
    user = User(
        name=name,
        email=email,
        phone=phone,
        role="agent",
        status="pending",
        business_name=business_name,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Registration received. An admin needs to approve your account before you can log in.",
        "user": user.to_dict(),
    }), 201


# ---------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------

def _login(role):
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email, role=role).first()
    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    if user.status == "pending":
        return jsonify({"error": "Your account is pending admin approval."}), 403
    if user.status == "deactivated":
        return jsonify({"error": "Your account has been deactivated."}), 403

    access_token, refresh_token = _issue_tokens(user)
    return jsonify({"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token}), 200


@auth_bp.route("/traveler/login", methods=["POST"])
def login_traveler():
    return _login("traveler")


@auth_bp.route("/agent/login", methods=["POST"])
def login_agent():
    return _login("agent")


@auth_bp.route("/admin/login", methods=["POST"])
def login_admin():
    return _login("admin")


# ---------------------------------------------------------------------
# Token refresh
# ---------------------------------------------------------------------

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id)) if user_id is not None else None
    if user is None:
        return jsonify({"error": "User not found."}), 401
    if user.status != "active":
        return jsonify({"error": "Your account is not active."}), 403

    access_token, refresh_token = _issue_tokens(user)
    return jsonify({"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token}), 200


# ---------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------

@auth_bp.route("/me", methods=["PUT"])
@login_required
def update_me():
    user = g.current_user
    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Name cannot be empty."}), 400
        user.name = name

    if "email" in data:
        email = (data.get("email") or "").strip().lower()
        if err := _validate_email(email):
            return jsonify({"error": err}), 400
        existing = User.query.filter(User.email == email, User.id != user.id).first()
        if existing:
            return jsonify({"error": "That email is already in use."}), 409
        user.email = email

    if "phone" in data:
        user.phone = (data.get("phone") or "").strip() or None

    if "business_name" in data and user.role == "agent":
        user.business_name = (data.get("business_name") or "").strip() or None

    if "password" in data and data.get("password"):
        if err := _validate_password(data["password"]):
            return jsonify({"error": err}), 400
        user.set_password(data["password"])

    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200


# ---------------------------------------------------------------------
# Forgot / reset password
# ---------------------------------------------------------------------

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    # Always return 200 with a generic message, even if the email doesn't
    # exist — this avoids leaking which emails are registered.
    user = User.query.filter_by(email=email).first()
    if user:
        token = generate_reset_token(user.email)
        frontend_base = request.headers.get("Origin") or (current_app.config["CORS_ORIGINS"][0] if current_app.config["CORS_ORIGINS"] else "")
        reset_url = f"{frontend_base}/reset-password?token={token}"
        send_password_reset_email(user.email, reset_url)

    return jsonify({"message": "If that email exists, a reset link has been sent."}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    token = data.get("token") or ""
    password = data.get("password") or ""

    if err := _validate_password(password):
        return jsonify({"error": err}), 400

    email = verify_reset_token(token)
    if not email:
        return jsonify({"error": "That reset link is invalid or has expired."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "That reset link is invalid or has expired."}), 400

    user.set_password(password)
    db.session.commit()
    return jsonify({"message": "Password updated. You can now log in."}), 200