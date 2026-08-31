"""
app/routes/trip_packages.py — browse, search, CRUD.

list_trip_packages() branches by role:
  admin    -> sees every trip package, any status
  agent    -> sees only their own trip packages, any status
  everyone -> (public / traveler) sees only status == "approved",
              with optional destination / price / date filters

This is why a traveler browsing never sees pending/rejected trips, but an
agent sees all their own regardless of status.

create_trip_package() and update_trip_package() both validate every field
manually (price must be a number >= 0, capacity >= 1, end_date can't be
before start_date) before touching the database — read these two closely
if you're adding a new field, you'll need to add validation for it here too.
"""

from datetime import datetime

from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from app.extensions import db
from app.models import TripPackage, Category, User
from app.utils.decorators import role_required

trip_packages_bp = Blueprint("trip_packages", __name__, url_prefix="/api/trip_packages")


def _parse_date(value, field_name):
    if not value:
        return None, f"{field_name} is required."
    try:
        return datetime.strptime(value, "%Y-%m-%d").date(), None
    except ValueError:
        return None, f"{field_name} must be in YYYY-MM-DD format."


def _parse_number(value, field_name, minimum=None, integer=False):
    if value is None or value == "":
        return None, f"{field_name} is required."
    try:
        num = int(value) if integer else float(value)
    except (TypeError, ValueError):
        return None, f"{field_name} must be a number."
    if minimum is not None and num < minimum:
        return None, f"{field_name} must be at least {minimum}."
    return num, None


def _current_user_optional():
    """Best-effort auth: returns the User if a valid token is present, else None.
    Used so public browsing works both logged-out and logged-in."""
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id is None:
            return None
        return User.query.get(int(user_id))
    except Exception:  # noqa: BLE001 - any bad/expired token just means "anonymous"
        return None


def _apply_categories(trip, category_ids):
    if category_ids is None:
        return
    trip.categories = Category.query.filter(Category.id.in_(category_ids)).all() if category_ids else []



@trip_packages_bp.route("", methods=["GET"])
def list_trip_packages():
    user = _current_user_optional()

    if user and user.role == "admin":
        query = TripPackage.query
    elif user and user.role == "agent":
        query = TripPackage.query.filter_by(agent_id=user.id)
    else:
        query = TripPackage.query.filter_by(status="approved")

        destination = request.args.get("destination")
        if destination:
            query = query.filter(TripPackage.destination.ilike(f"%{destination}%"))

        min_price = request.args.get("min_price")
        if min_price:
            query = query.filter(TripPackage.price >= float(min_price))

        max_price = request.args.get("max_price")
        if max_price:
            query = query.filter(TripPackage.price <= float(max_price))

        start_after = request.args.get("start_after")
        if start_after:
            parsed, err = _parse_date(start_after, "start_after")
            if not err:
                query = query.filter(TripPackage.start_date >= parsed)

        category_id = request.args.get("category_id")
        if category_id:
            query = query.filter(TripPackage.categories.any(Category.id == int(category_id)))

    # These filters also apply for agent/admin views, e.g. an agent filtering their own list
    status_filter = request.args.get("status")
    if status_filter and (user and user.role in ("agent", "admin")):
        query = query.filter(TripPackage.status == status_filter)

    trips = query.order_by(TripPackage.created_at.desc()).all()
    return jsonify([t.to_dict() for t in trips]), 200


@trip_packages_bp.route("/<int:trip_id>", methods=["GET"])
def get_trip_package(trip_id):
    trip = TripPackage.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip package not found."}), 404

    user = _current_user_optional()
    is_owner_or_admin = user and (user.role == "admin" or (user.role == "agent" and trip.agent_id == user.id))

    if trip.status != "approved" and not is_owner_or_admin:
        return jsonify({"error": "Trip package not found."}), 404

    return jsonify(trip.to_dict()), 200



@trip_packages_bp.route("", methods=["POST"])
@role_required("agent")
def create_trip_package():
    data = request.get_json(silent=True) or {}
    user = g.current_user

    title = (data.get("title") or "").strip()
    destination = (data.get("destination") or "").strip()
    if not title:
        return jsonify({"error": "Title is required."}), 400
    if not destination:
        return jsonify({"error": "Destination is required."}), 400

    price, err = _parse_number(data.get("price"), "Price", minimum=0)
    if err:
        return jsonify({"error": err}), 400

    capacity, err = _parse_number(data.get("capacity"), "Capacity", minimum=1, integer=True)
    if err:
        return jsonify({"error": err}), 400

    start_date, err = _parse_date(data.get("start_date"), "Start date")
    if err:
        return jsonify({"error": err}), 400

    end_date, err = _parse_date(data.get("end_date"), "End date")
    if err:
        return jsonify({"error": err}), 400

    if end_date < start_date:
        return jsonify({"error": "End date can't be before start date."}), 400

    trip = TripPackage(
        agent_id=user.id,
        title=title,
        destination=destination,
        itinerary=data.get("itinerary"),
        description=data.get("description"),
        price=price,
        capacity=capacity,
        spots_booked=0,
        start_date=start_date,
        end_date=end_date,
        image_url=data.get("image_url"),
        status="pending",  # every new trip package starts pending admin approval
    )
    _apply_categories(trip, data.get("category_ids"))

    db.session.add(trip)
    db.session.commit()
    return jsonify(trip.to_dict()), 201


def _get_editable_trip_or_error(trip_id, user):
    trip = TripPackage.query.get(trip_id)
    if not trip:
        return None, (jsonify({"error": "Trip package not found."}), 404)
    if user.role != "admin" and trip.agent_id != user.id:
        return None, (jsonify({"error": "You do not have permission to edit this trip package."}), 403)
    return trip, None


@trip_packages_bp.route("/<int:trip_id>", methods=["PUT"])
@role_required("agent", "admin")
def update_trip_package(trip_id):
    user = g.current_user
    trip, error = _get_editable_trip_or_error(trip_id, user)
    if error:
        return error

    data = request.get_json(silent=True) or {}

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "Title cannot be empty."}), 400
        trip.title = title

    if "destination" in data:
        destination = (data.get("destination") or "").strip()
        if not destination:
            return jsonify({"error": "Destination cannot be empty."}), 400
        trip.destination = destination

    if "itinerary" in data:
        trip.itinerary = data.get("itinerary")

    if "description" in data:
        trip.description = data.get("description")

    if "price" in data:
        price, err = _parse_number(data.get("price"), "Price", minimum=0)
        if err:
            return jsonify({"error": err}), 400
        trip.price = price

    if "capacity" in data:
        capacity, err = _parse_number(data.get("capacity"), "Capacity", minimum=1, integer=True)
        if err:
            return jsonify({"error": err}), 400
        if capacity < trip.spots_booked:
            return jsonify({"error": f"Capacity can't be less than the {trip.spots_booked} spots already booked."}), 400
        trip.capacity = capacity

    new_start = trip.start_date
    new_end = trip.end_date
    if "start_date" in data:
        new_start, err = _parse_date(data.get("start_date"), "Start date")
        if err:
            return jsonify({"error": err}), 400
    if "end_date" in data:
        new_end, err = _parse_date(data.get("end_date"), "End date")
        if err:
            return jsonify({"error": err}), 400
    if new_end < new_start:
        return jsonify({"error": "End date can't be before start date."}), 400
    trip.start_date, trip.end_date = new_start, new_end

    if "image_url" in data:
        trip.image_url = data.get("image_url")

    if "category_ids" in data:
        _apply_categories(trip, data.get("category_ids"))

    # Agents editing an approved trip send it back to pending for re-review.
    # Admins can set status directly (used for approve/reject/blacklist too,
    # though the dedicated admin routes are the normal way to do that).
    if user.role == "admin" and "status" in data:
        trip.status = data["status"]
    elif user.role == "agent" and trip.status == "approved":
        trip.status = "pending"

    db.session.commit()
    return jsonify(trip.to_dict()), 200


@trip_packages_bp.route("/<int:trip_id>", methods=["DELETE"])
@role_required("agent", "admin")
def delete_trip_package(trip_id):
    user = g.current_user
    trip, error = _get_editable_trip_or_error(trip_id, user)
    if error:
        return error

    if trip.spots_booked > 0:
        return jsonify({"error": "Can't delete a trip package with existing bookings. Cancel bookings first."}), 409

    db.session.delete(trip)
    db.session.commit()
    return jsonify({"message": "Trip package deleted."}), 200


@trip_packages_bp.route("/categories", methods=["GET"])
def list_categories():
    categories = Category.query.order_by(Category.name).all()
    return jsonify([c.to_dict() for c in categories]), 200