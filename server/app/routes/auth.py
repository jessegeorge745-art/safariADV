import re

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models.user import User
from app.utils.decorators import login_required
from app.utils.tokens import generate_reset_token, verify_reset_token
from app.utils.mailer import send_password_reset_email

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validate_password(password):
    """Single place to change password rules."""
    min_len = current_app.config.get("MIN_PASSWORD_LENGTH", 8)
    if not password or len(password) < min_len:
        return f"Password must be at least {min_len} characters long."
    return None


def _validate_email(email):
    if not email or not EMAIL_RE.match(email):
        return "A valid email address is required."
    return None


def _issue_token(user):
    return create_access_token(
        identity=str(user.id), additional_claims={"role": user.role}
    )


def _register(role):
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip() or None
    password = data.get("password") or ""

    if not name:
        return jsonify({"error": "Name is required."}), 400
    err = _validate_email(email)
    if err:
        return jsonify({"error": err}), 400
    err = _validate_password(password)
    if err:
        return jsonify({"error": err}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with that email already exists."}), 409

    user = User(name=name, email=email, phone=phone, role=role)

    if role == "agent":
        business_name = (data.get("business_name") or "").strip()
        if not business_name:
            return jsonify({"error": "business_name is required for agents."}), 400
        user.business_name = business_name
        user.status = "pending"  # cannot log in until an admin activates them
    else:
        user.status = "active"

    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    resp = {"user": user.to_dict()}
    if role != "agent":
        resp["access_token"] = _issue_token(user)
    else:
        resp["message"] = (
            "Registration received. Your account is pending admin approval "
            "before you can log in."
        )
    return jsonify(resp), 201


@auth_bp.route("/traveler/register", methods=["POST"])
def register_traveler():
    return _register("traveler")


@auth_bp.route("/agent/register", methods=["POST"])
def register_agent():
    return _register("agent")


def _login(expected_role):
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    if expected_role and user.role != expected_role:
        return jsonify({"error": "Invalid email or password."}), 401

    if user.status == "pending":
        return jsonify({"error": "Your account is pending admin approval."}), 403
    if user.status == "deactivated":
        return jsonify({"error": "This account has been deactivated."}), 403

    return jsonify({"user": user.to_dict(), "access_token": _issue_token(user)}), 200


@auth_bp.route("/traveler/login", methods=["POST"])
def login_traveler():
    return _login("traveler")


@auth_bp.route("/agent/login", methods=["POST"])
def login_agent():
    return _login("agent")


@auth_bp.route("/admin/login", methods=["POST"])
def login_admin():
    return _login("admin")


@auth_bp.route("/me", methods=["GET"])
@login_required
def get_me(current_user):
    return jsonify({"user": current_user.to_dict()}), 200


@auth_bp.route("/me", methods=["PUT"])
@login_required
def update_me(current_user):
    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Name cannot be empty."}), 400
        current_user.name = name

    if "email" in data:
        email = (data.get("email") or "").strip().lower()
        err = _validate_email(email)
        if err:
            return jsonify({"error": err}), 400
        existing = User.query.filter_by(email=email).first()
        if existing and existing.id != current_user.id:
            return jsonify({"error": "That email is already in use."}), 409
        current_user.email = email

    if "phone" in data:
        current_user.phone = (data.get("phone") or "").strip() or None

    if "business_name" in data and current_user.role == "agent":
        current_user.business_name = (data.get("business_name") or "").strip() or None

    if "password" in data and data.get("password"):
        err = _validate_password(data["password"])
        if err:
            return jsonify({"error": err}), 400
        current_user.set_password(data["password"])

    db.session.commit()
    return jsonify({"user": current_user.to_dict()}), 200


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    user = User.query.filter_by(email=email).first()
    # Always return 200 regardless of whether the account exists, so a
    # caller can't use this endpoint to enumerate registered emails.
    if user:
        token = generate_reset_token(user.email)
        reset_url = f"{current_app.config['FRONTEND_URL']}/reset-password?token={token}"
        send_password_reset_email(user, reset_url)

    return jsonify(
        {"message": "If that email is registered, a reset link has been sent."}
    ), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    token = data.get("token")
    new_password = data.get("password") or ""

    if not token:
        return jsonify({"error": "token is required."}), 400

    email = verify_reset_token(token)
    if not email:
        return jsonify({"error": "This reset link is invalid or has expired."}), 400

    err = _validate_password(new_password)
    if err:
        return jsonify({"error": err}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "This reset link is invalid or has expired."}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password has been reset. You can now log in."}), 200
