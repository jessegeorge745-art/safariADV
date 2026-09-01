import re

from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from app.extensions import db
from app.models.booking import Booking, BOOKING_STATUSES, PAYMENT_STATUSES
from app.models.trip_package import TripPackage
from app.models.user import User
from app.utils.decorators import role_required, login_required
from app.utils.mailer import send_booking_confirmation

bookings_bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _optional_current_user():
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        return None
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return User.query.get(int(user_id))


@bookings_bp.route("", methods=["POST"])
def create_booking():
    """Handles both logged-in travelers and guests in one function."""
    current_user = _optional_current_user()
    is_traveler_session = bool(current_user and current_user.role == "traveler")

    data = request.get_json(silent=True) or {}

    trip_id = data.get("trip_package_id")
    trip = TripPackage.query.get(trip_id) if trip_id else None
    if not trip or trip.status != "approved":
        return jsonify({"error": "Trip package not found or not bookable."}), 404

    try:
        spots = int(data.get("spots", 1))
    except (TypeError, ValueError):
        return jsonify({"error": "spots must be an integer."}), 400
    if spots < 1:
        return jsonify({"error": "spots must be at least 1."}), 400

    if trip.spots_remaining < spots:
        return jsonify(
            {"error": f"Only {trip.spots_remaining} spot(s) remaining on this trip."}
        ), 400

    booking = Booking(trip_package_id=trip.id, spots=spots)

    if is_traveler_session:
        booking.user_id = current_user.id
    else:
        guest_name = (data.get("guest_name") or "").strip()
        guest_email = (data.get("guest_email") or "").strip().lower()
        guest_phone = (data.get("guest_phone") or "").strip()

        if not guest_name:
            return jsonify({"error": "guest_name is required."}), 400
        if not guest_email or not EMAIL_RE.match(guest_email):
            return jsonify({"error": "A valid guest_email is required."}), 400
        if not guest_phone:
            return jsonify({"error": "guest_phone is required."}), 400

        booking.guest_name = guest_name
        booking.guest_email = guest_email
        booking.guest_phone = guest_phone

    db.session.add(booking)
    db.session.commit()

    send_booking_confirmation(booking)

    return jsonify(booking.to_dict()), 201


@bookings_bp.route("", methods=["GET"])
@login_required
def list_bookings(current_user):
    """Travelers see their own bookings; agents see bookings on their trips;
    admins see everything."""
    if current_user.role == "traveler":
        query = Booking.query.filter_by(user_id=current_user.id)
    elif current_user.role == "agent":
        query = Booking.query.join(TripPackage).filter(
            TripPackage.agent_id == current_user.id
        )
    else:  # admin
        query = Booking.query

    bookings = query.order_by(Booking.created_at.desc()).all()
    return jsonify([b.to_dict() for b in bookings]), 200


@bookings_bp.route("/<int:booking_id>", methods=["GET"])
@login_required
def get_booking(current_user, booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found."}), 404

    allowed = (
        current_user.role == "admin"
        or (current_user.role == "traveler" and booking.user_id == current_user.id)
        or (
            current_user.role == "agent"
            and booking.trip_package.agent_id == current_user.id
        )
    )
    if not allowed:
        return jsonify({"error": "Booking not found."}), 404

    return jsonify(booking.to_dict()), 200


@bookings_bp.route("/<int:booking_id>", methods=["PUT"])
@role_required("traveler", "agent", "admin")
def update_booking(current_user, booking_id):
    """Single source of truth for booking `status` transitions.

    Confirming a booking increments trip_package.spots_booked; cancelling a
    confirmed booking decrements it back; cancelling a paid booking
    auto-sets payment_status to refunded.
    """
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found."}), 404

    is_owner_agent = (
        current_user.role == "agent" and booking.trip_package.agent_id == current_user.id
    )
    is_owner_traveler = (
        current_user.role == "traveler" and booking.user_id == current_user.id
    )
    if current_user.role not in ("admin",) and not (is_owner_agent or is_owner_traveler):
        return jsonify({"error": "Booking not found."}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "status is required."}), 400
    if new_status not in BOOKING_STATUSES:
        return jsonify({"error": f"status must be one of {BOOKING_STATUSES}."}), 400

    # A traveler may only cancel their own booking, not confirm/complete it.
    if is_owner_traveler and current_user.role == "traveler" and not is_owner_agent:
        if new_status != "cancelled":
            return jsonify({"error": "Travelers may only cancel a booking."}), 403

    trip = booking.trip_package
    old_status = booking.status

    if new_status == "confirmed" and old_status != "confirmed":
        if trip.spots_remaining < booking.spots:
            return jsonify({"error": "Not enough spots remaining to confirm this booking."}), 400
        trip.spots_booked += booking.spots

    if new_status == "cancelled" and old_status == "confirmed":
        trip.spots_booked = max(trip.spots_booked - booking.spots, 0)
        if booking.payment_status == "paid":
            booking.payment_status = "refunded"

    booking.status = new_status
    db.session.commit()
    return jsonify(booking.to_dict()), 200


@bookings_bp.route("/<int:booking_id>/payment", methods=["PUT"])
@role_required("agent", "admin")
def update_payment_status(current_user, booking_id):
    """Marking a booking paid/failed/refunded - an agent or admin action."""
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found."}), 404

    if current_user.role == "agent" and booking.trip_package.agent_id != current_user.id:
        return jsonify({"error": "Booking not found."}), 404

    data = request.get_json(silent=True) or {}
    new_payment_status = data.get("payment_status")
    if new_payment_status not in PAYMENT_STATUSES:
        return jsonify({"error": f"payment_status must be one of {PAYMENT_STATUSES}."}), 400

    booking.payment_status = new_payment_status
    db.session.commit()
    return jsonify(booking.to_dict()), 200
