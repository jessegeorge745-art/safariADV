from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models.user import User
from app.models.trip_package import TripPackage
from app.models.booking import Booking
from app.models.setting import Setting
from app.utils.decorators import role_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

TRIP_ACTIONS = {
    "approve": "approved",
    "reject": "rejected",
    "blacklist": "blacklisted",
}


@admin_bp.route("/reports", methods=["GET"])
@role_required("admin")
def reports(current_user):
    total_users = User.query.count()
    approved_trips = TripPackage.query.filter_by(status="approved").count()
    pending_trips = TripPackage.query.filter_by(status="pending").count()

    paid_bookings = Booking.query.filter_by(payment_status="paid").all()
    total_revenue = sum(float(b.total_amount or 0) for b in paid_bookings)

    trips = TripPackage.query.all()
    trip_rows = []
    destination_counts = {}
    for trip in trips:
        paid = [b for b in trip.bookings if b.payment_status == "paid"]
        trip_rows.append(
            {
                "id": trip.id,
                "title": trip.title,
                "bookings_count": len(trip.bookings),
                "revenue": sum(float(b.total_amount or 0) for b in paid),
            }
        )
        confirmed = [b for b in trip.bookings if b.status in ("confirmed", "completed")]
        if confirmed:
            destination_counts[trip.destination] = (
                destination_counts.get(trip.destination, 0) + len(confirmed)
            )

    top_trips = sorted(trip_rows, key=lambda t: t["revenue"], reverse=True)[:5]
    top_destinations = sorted(
        ({"destination": d, "count": c} for d, c in destination_counts.items()),
        key=lambda d: d["count"],
        reverse=True,
    )[:5]

    return jsonify(
        {
            "total_users": total_users,
            "approved_trips": approved_trips,
            "pending_trips": pending_trips,
            "total_revenue": total_revenue,
            "top_trips": top_trips,
            "top_destinations": top_destinations,
        }
    ), 200


@admin_bp.route("/users", methods=["GET"])
@role_required("admin")
def list_users(current_user):
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@role_required("admin")
def update_user_status(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in ("active", "pending", "deactivated"):
        return jsonify(
            {"error": "status must be one of active, pending, deactivated."}
        ), 400

    user.status = new_status
    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@role_required("admin")
def delete_user(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    if user.role == "admin":
        return jsonify({"error": "Admin accounts cannot be deleted here."}), 400

    if user.role == "agent":
        # Cascades to that agent's bookings/reviews/favorites via
        # TripPackage's own cascade="all, delete-orphan".
        for trip in list(user.trip_packages):
            db.session.delete(trip)
    else:
        # Keep the booking history but detach it from the deleted account -
        # it becomes an anonymous booking rather than disappearing.
        for booking in list(user.bookings):
            booking.user_id = None

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted."}), 200


@admin_bp.route("/settings", methods=["GET"])
def get_settings():
    """Public - the cancellation policy needs to be visible on the booking
    panel before anyone has logged in."""
    settings = Setting.query.all()
    return jsonify({s.key: s.value for s in settings}), 200


@admin_bp.route("/settings", methods=["PUT"])
@role_required("admin")
def update_settings(current_user):
    data = request.get_json(silent=True) or {}
    for key, value in data.items():
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            setting.value = value
        else:
            db.session.add(Setting(key=key, value=value))
    db.session.commit()

    settings = Setting.query.all()
    return jsonify({s.key: s.value for s in settings}), 200


@admin_bp.route("/trip_packages/<int:trip_id>/<action>", methods=["PUT"])
@role_required("admin")
def moderate_trip_package(current_user, trip_id, action):
    if action not in TRIP_ACTIONS:
        return jsonify({"error": f"Unknown action '{action}'."}), 400

    trip = TripPackage.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip package not found."}), 404

    trip.status = TRIP_ACTIONS[action]
    db.session.commit()
    return jsonify(trip.to_dict()), 200
