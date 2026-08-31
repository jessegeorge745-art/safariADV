"""
app/routes/admin.py — platform oversight.

Users            GET/PUT/DELETE /api/admin/users/...
Trip moderation  PUT /api/admin/trip_packages/<id>/approve|reject|blacklist
All bookings     GET /api/admin/bookings
Reports          GET /api/admin/reports  (revenue, top trips, top destinations)
Settings         GET /api/admin/settings/<key>  (public read)
                 PUT /api/admin/settings/<key>  (admin-only write)
"""

from collections import defaultdict

from flask import Blueprint, request, jsonify, g
from sqlalchemy import func

from app.extensions import db
from app.models import User, TripPackage, Booking, Setting, Category
from app.utils.decorators import role_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ---------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------

@admin_bp.route("/users", methods=["GET"])
@role_required("admin")
def list_users():
    query = User.query

    role = request.args.get("role")
    if role:
        query = query.filter_by(role=role)

    status = request.args.get("status")
    if status:
        query = query.filter_by(status=status)

    users = query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@role_required("admin")
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify(user.to_dict()), 200


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@role_required("admin")
def update_user(user_id):
    """The route that activates a pending agent: PUT {"status": "active"}.
    Also used to deactivate any user, or reactivate one."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json(silent=True) or {}

    if "status" in data:
        new_status = data["status"]
        if new_status not in ("active", "pending", "deactivated"):
            return jsonify({"error": "status must be one of: active, pending, deactivated."}), 400
        if user.id == g.current_user.id and new_status != "active":
            return jsonify({"error": "You can't deactivate your own account."}), 400
        user.status = new_status

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Name cannot be empty."}), 400
        user.name = name

    if "phone" in data:
        user.phone = (data.get("phone") or "").strip() or None

    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@role_required("admin")
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    if user.id == g.current_user.id:
        return jsonify({"error": "You can't delete your own account."}), 400

    if user.role == "agent" and user.trip_packages.count() > 0:
        return jsonify({"error": "Can't delete an agent with existing trip packages. Deactivate instead."}), 409

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted."}), 200


# ---------------------------------------------------------------------
# Trip package moderation
# ---------------------------------------------------------------------

def _moderate(trip_id, new_status):
    trip = TripPackage.query.get(trip_id)
    if not trip:
        return None, (jsonify({"error": "Trip package not found."}), 404)
    trip.status = new_status
    db.session.commit()
    return trip, None


@admin_bp.route("/trip_packages/<int:trip_id>/approve", methods=["PUT"])
@role_required("admin")
def approve_trip_package(trip_id):
    trip, error = _moderate(trip_id, "approved")
    if error:
        return error
    return jsonify(trip.to_dict()), 200


@admin_bp.route("/trip_packages/<int:trip_id>/reject", methods=["PUT"])
@role_required("admin")
def reject_trip_package(trip_id):
    trip, error = _moderate(trip_id, "rejected")
    if error:
        return error
    return jsonify(trip.to_dict()), 200


@admin_bp.route("/trip_packages/<int:trip_id>/blacklist", methods=["PUT"])
@role_required("admin")
def blacklist_trip_package(trip_id):
    trip, error = _moderate(trip_id, "blacklisted")
    if error:
        return error
    return jsonify(trip.to_dict()), 200


# ---------------------------------------------------------------------
# All bookings (admin oversight view)
# ---------------------------------------------------------------------

@admin_bp.route("/bookings", methods=["GET"])
@role_required("admin")
def list_all_bookings():
    query = Booking.query

    status = request.args.get("status")
    if status:
        query = query.filter_by(status=status)

    payment_status = request.args.get("payment_status")
    if payment_status:
        query = query.filter_by(payment_status=payment_status)

    bookings = query.order_by(Booking.created_at.desc()).all()
    return jsonify([b.to_dict() for b in bookings]), 200


# ---------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------

@admin_bp.route("/reports", methods=["GET"])
@role_required("admin")
def reports():
    # Revenue = sum of total_price for bookings that have actually been paid.
    revenue = (
        db.session.query(func.coalesce(func.sum(Booking.total_price), 0))
        .filter(Booking.payment_status == "paid")
        .scalar()
    )

    booking_counts = dict(
        db.session.query(Booking.status, func.count(Booking.id)).group_by(Booking.status).all()
    )

    top_trips_rows = (
        db.session.query(
            TripPackage.id,
            TripPackage.title,
            TripPackage.destination,
            func.count(Booking.id).label("booking_count"),
            func.coalesce(func.sum(Booking.total_price), 0).label("revenue"),
        )
        .join(Booking, Booking.trip_package_id == TripPackage.id)
        .filter(Booking.payment_status == "paid")
        .group_by(TripPackage.id)
        .order_by(func.coalesce(func.sum(Booking.total_price), 0).desc())
        .limit(5)
        .all()
    )
    top_trips = [
        {
            "trip_package_id": row.id,
            "title": row.title,
            "destination": row.destination,
            "booking_count": row.booking_count,
            "revenue": float(row.revenue),
        }
        for row in top_trips_rows
    ]

    destination_rows = (
        db.session.query(
            TripPackage.destination,
            func.count(Booking.id).label("booking_count"),
        )
        .join(Booking, Booking.trip_package_id == TripPackage.id)
        .group_by(TripPackage.destination)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
        .all()
    )
    top_destinations = [
        {"destination": row.destination, "booking_count": row.booking_count} for row in destination_rows
    ]

    return jsonify({
        "revenue": float(revenue),
        "booking_counts": booking_counts,
        "total_trip_packages": TripPackage.query.count(),
        "total_users": User.query.count(),
        "top_trips": top_trips,
        "top_destinations": top_destinations,
    }), 200


# ---------------------------------------------------------------------
# Settings (cancellation policy, etc.) — GET is public, PUT is admin-only
# ---------------------------------------------------------------------

@admin_bp.route("/settings/<string:key>", methods=["GET"])
def get_setting(key):
    setting = Setting.query.filter_by(key=key).first()
    if not setting:
        return jsonify({"error": "Setting not found."}), 404
    return jsonify(setting.to_dict()), 200


@admin_bp.route("/settings/<string:key>", methods=["PUT"])
@role_required("admin")
def update_setting(key):
    data = request.get_json(silent=True) or {}
    value = data.get("value")

    setting = Setting.query.filter_by(key=key).first()
    if not setting:
        setting = Setting(key=key, value=value)
        db.session.add(setting)
    else:
        setting.value = value

    db.session.commit()
    return jsonify(setting.to_dict()), 200