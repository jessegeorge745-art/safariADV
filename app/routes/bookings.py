"""
app/routes/bookings.py — the booking lifecycle.

create_booking() handles both logged-in travelers and guests in one
function — it checks whether the request is an authenticated traveler
session and only requires guest_name/guest_email/guest_phone when there's
no session. spots_remaining is checked before allowing the booking through.

update_booking(booking_id) is where all status transitions happen —
confirming a booking increments trip_package.spots_booked, cancelling a
confirmed one decrements it back, and cancelling a paid booking auto-sets
payment_status to "refunded". This function is the single source of truth
for booking state — don't update `status` anywhere else in the codebase.

update_payment_status(booking_id) is the separate endpoint for marking a
booking paid/failed/refunded — an agent or admin action, not a traveler one.
"""

from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from app.extensions import db
from app.models import Booking, TripPackage, User
from app.utils.decorators import role_required
from app.utils.mailer import send_booking_confirmation

bookings_bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")

VALID_STATUS_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


def _current_traveler_optional():
    """Returns the authenticated User if this is a logged-in traveler session,
    else None (meaning: treat this as a guest booking)."""
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id is None:
            return None
        user = User.query.get(int(user_id))
        return user if user and user.role == "traveler" else None
    except Exception:  # noqa: BLE001
        return None


# ---------------------------------------------------------------------
# Create a booking (traveler or guest)
# ---------------------------------------------------------------------

@bookings_bp.route("", methods=["POST"])
def create_booking():
    data = request.get_json(silent=True) or {}
    traveler = _current_traveler_optional()
    is_traveler_session = traveler is not None

    trip_id = data.get("trip_package_id")
    if not trip_id:
        return jsonify({"error": "trip_package_id is required."}), 400

    trip = TripPackage.query.get(trip_id)
    if not trip or trip.status != "approved":
        return jsonify({"error": "Trip package not found or not currently bookable."}), 404

    seats_raw = data.get("seats", 1)
    try:
        seats = int(seats_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "seats must be a whole number."}), 400
    if seats < 1:
        return jsonify({"error": "seats must be at least 1."}), 400

    if seats > trip.spots_remaining:
        return jsonify({"error": f"Only {trip.spots_remaining} spot(s) left on this trip."}), 409

    guest_name = guest_email = guest_phone = None
    if not is_traveler_session:
        guest_name = (data.get("guest_name") or "").strip()
        guest_email = (data.get("guest_email") or "").strip().lower()
        guest_phone = (data.get("guest_phone") or "").strip()
        if not guest_name or not guest_email or not guest_phone:
            return jsonify({"error": "guest_name, guest_email, and guest_phone are required for a guest booking."}), 400

    booking = Booking(
        user_id=traveler.id if is_traveler_session else None,
        trip_package_id=trip.id,
        guest_name=guest_name,
        guest_email=guest_email,
        guest_phone=guest_phone,
        seats=seats,
        total_price=float(trip.price) * seats,
        status="pending",
        payment_status="unpaid",
        notes=(data.get("notes") or "").strip() or None,
    )
    db.session.add(booking)
    db.session.commit()

    send_booking_confirmation(booking)

    return jsonify(booking.to_dict()), 201


# ---------------------------------------------------------------------
# List bookings — scoped by role
# ---------------------------------------------------------------------

@bookings_bp.route("", methods=["GET"])
@role_required("traveler", "agent", "admin")
def list_bookings():
    user = g.current_user

    if user.role == "traveler":
        query = Booking.query.filter_by(user_id=user.id)
    elif user.role == "agent":
        query = Booking.query.join(TripPackage).filter(TripPackage.agent_id == user.id)
    else:  # admin
        query = Booking.query

    trip_id = request.args.get("trip_package_id")
    if trip_id:
        query = query.filter(Booking.trip_package_id == int(trip_id))

    status = request.args.get("status")
    if status:
        query = query.filter(Booking.status == status)

    bookings = query.order_by(Booking.created_at.desc()).all()
    return jsonify([b.to_dict() for b in bookings]), 200


@bookings_bp.route("/<int:booking_id>", methods=["GET"])
@role_required("traveler", "agent", "admin")
def get_booking(booking_id):
    user = g.current_user
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found."}), 404

    if user.role == "traveler" and booking.user_id != user.id:
        return jsonify({"error": "Booking not found."}), 404
    if user.role == "agent" and booking.trip_package.agent_id != user.id:
        return jsonify({"error": "Booking not found."}), 404

    return jsonify(booking.to_dict()), 200


# ---------------------------------------------------------------------
# Status transitions
# ---------------------------------------------------------------------

@bookings_bp.route("/<int:booking_id>", methods=["PUT"])
@role_required("traveler", "agent", "admin")
def update_booking(booking_id):
    user = g.current_user
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found."}), 404

    trip = booking.trip_package
    is_owning_agent = user.role == "agent" and trip.agent_id == user.id
    is_owning_traveler = user.role == "traveler" and booking.user_id == user.id

    if not (user.role == "admin" or is_owning_agent or is_owning_traveler):
        return jsonify({"error": "Booking not found."}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "status is required."}), 400

    # Travelers may only cancel their own pending/confirmed booking.
    if is_owning_traveler and new_status != "cancelled":
        return jsonify({"error": "Travelers can only cancel a booking."}), 403

    allowed_next = VALID_STATUS_TRANSITIONS.get(booking.status, set())
    if new_status not in allowed_next:
        return jsonify({"error": f"Can't move a booking from '{booking.status}' to '{new_status}'."}), 400

    if new_status == "confirmed":
        if booking.seats > trip.spots_remaining:
            return jsonify({"error": f"Only {trip.spots_remaining} spot(s) left on this trip."}), 409
        trip.spots_booked += booking.seats

    elif new_status == "cancelled":
        if booking.status == "confirmed":
            trip.spots_booked = max(trip.spots_booked - booking.seats, 0)
        if booking.payment_status == "paid":
            booking.payment_status = "refunded"

    booking.status = new_status
    db.session.commit()
    return jsonify(booking.to_dict()), 200


@bookings_bp.route("/<int:booking_id>/payment", methods=["PUT"])
@role_required("agent", "admin")
def update_payment_status(booking_id):
    user = g.current_user
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found."}), 404

    if user.role == "agent" and booking.trip_package.agent_id != user.id:
        return jsonify({"error": "Booking not found."}), 404

    data = request.get_json(silent=True) or {}
    new_payment_status = data.get("payment_status")
    if new_payment_status not in ("unpaid", "paid", "failed", "refunded"):
        return jsonify({"error": "payment_status must be one of: unpaid, paid, failed, refunded."}), 400

    booking.payment_status = new_payment_status
    db.session.commit()
    return jsonify(booking.to_dict()), 200