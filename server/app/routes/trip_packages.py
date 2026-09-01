from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt

from app.extensions import db
from app.models.trip_package import TripPackage
from app.models.category import Category
from app.models.user import User
from app.utils.decorators import role_required

trip_packages_bp = Blueprint("trip_packages", __name__, url_prefix="/api/trip_packages")


def _parse_date(value, field_name):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a date in YYYY-MM-DD format.")


def _optional_current_user():
    """Best-effort JWT read for a route that's public but behaves
    differently when someone happens to be logged in (browse listing)."""
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        return None
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return User.query.get(int(user_id))


@trip_packages_bp.route("", methods=["GET"])
def list_trip_packages():
    current_user = _optional_current_user()
    role = current_user.role if current_user else None

    if role == "admin":
        query = TripPackage.query
    elif role == "agent":
        query = TripPackage.query.filter_by(agent_id=current_user.id)
    else:
        query = TripPackage.query.filter_by(status="approved")

        destination = request.args.get("destination")
        if destination:
            query = query.filter(TripPackage.destination.ilike(f"%{destination}%"))

        min_price = request.args.get("min_price", type=float)
        if min_price is not None:
            query = query.filter(TripPackage.price >= min_price)

        max_price = request.args.get("max_price", type=float)
        if max_price is not None:
            query = query.filter(TripPackage.price <= max_price)

        start_after = request.args.get("start_after")
        if start_after:
            try:
                query = query.filter(TripPackage.start_date >= _parse_date(start_after, "start_after"))
            except ValueError as e:
                return jsonify({"error": str(e)}), 400

        category = request.args.get("category")
        if category:
            query = query.join(TripPackage.categories).filter(
                Category.slug == category
            )

    query = query.order_by(TripPackage.created_at.desc())
    trips = query.all()
    return jsonify([t.to_dict() for t in trips]), 200


@trip_packages_bp.route("/<int:trip_id>", methods=["GET"])
def get_trip_package(trip_id):
    current_user = _optional_current_user()
    trip = TripPackage.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip package not found."}), 404

    if trip.status != "approved":
        allowed = current_user and (
            current_user.role == "admin"
            or (current_user.role == "agent" and current_user.id == trip.agent_id)
        )
        if not allowed:
            return jsonify({"error": "Trip package not found."}), 404

    return jsonify(trip.to_dict()), 200


def _validate_trip_fields(data, partial=False):
    """Validates price >= 0, capacity >= 1, end_date not before start_date, etc.
    Returns (cleaned_fields, error_message)."""
    cleaned = {}

    def required(field):
        return not partial and field not in data

    if "title" in data or required("title"):
        title = (data.get("title") or "").strip()
        if not title:
            return None, "title is required."
        cleaned["title"] = title

    if "destination" in data or required("destination"):
        destination = (data.get("destination") or "").strip()
        if not destination:
            return None, "destination is required."
        cleaned["destination"] = destination

    if "itinerary" in data:
        cleaned["itinerary"] = data.get("itinerary")

    if "price" in data or required("price"):
        price = data.get("price")
        try:
            price = float(price)
        except (TypeError, ValueError):
            return None, "price must be a number."
        if price < 0:
            return None, "price must be >= 0."
        cleaned["price"] = price

    if "capacity" in data or required("capacity"):
        capacity = data.get("capacity")
        try:
            capacity = int(capacity)
        except (TypeError, ValueError):
            return None, "capacity must be an integer."
        if capacity < 1:
            return None, "capacity must be >= 1."
        cleaned["capacity"] = capacity

    start_date = None
    end_date = None
    if "start_date" in data or required("start_date"):
        try:
            start_date = _parse_date(data.get("start_date"), "start_date")
        except ValueError as e:
            return None, str(e)
        cleaned["start_date"] = start_date

    if "end_date" in data or required("end_date"):
        try:
            end_date = _parse_date(data.get("end_date"), "end_date")
        except ValueError as e:
            return None, str(e)
        cleaned["end_date"] = end_date

    if start_date and end_date and end_date < start_date:
        return None, "end_date cannot be before start_date."

    if "image_url" in data:
        cleaned["image_url"] = data.get("image_url")

    return cleaned, None


@trip_packages_bp.route("", methods=["POST"])
@role_required("agent")
def create_trip_package(current_user):
    data = request.get_json(silent=True) or {}
    cleaned, err = _validate_trip_fields(data, partial=False)
    if err:
        return jsonify({"error": err}), 400

    trip = TripPackage(agent_id=current_user.id, status="pending", **cleaned)

    category_ids = data.get("category_ids") or []
    if category_ids:
        trip.categories = Category.query.filter(Category.id.in_(category_ids)).all()

    db.session.add(trip)
    db.session.commit()
    return jsonify(trip.to_dict()), 201


@trip_packages_bp.route("/<int:trip_id>", methods=["PUT"])
@role_required("agent", "admin")
def update_trip_package(current_user, trip_id):
    trip = TripPackage.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip package not found."}), 404

    if current_user.role == "agent" and trip.agent_id != current_user.id:
        return jsonify({"error": "You do not own this trip package."}), 403

    data = request.get_json(silent=True) or {}
    cleaned, err = _validate_trip_fields(data, partial=True)
    if err:
        return jsonify({"error": err}), 400

    for key, value in cleaned.items():
        setattr(trip, key, value)

    if "category_ids" in data:
        trip.categories = Category.query.filter(
            Category.id.in_(data.get("category_ids") or [])
        ).all()

    # Editing an already-approved trip sends it back to pending review,
    # unless an admin is the one making the edit.
    if current_user.role == "agent" and cleaned:
        trip.status = "pending"

    db.session.commit()
    return jsonify(trip.to_dict()), 200


@trip_packages_bp.route("/<int:trip_id>", methods=["DELETE"])
@role_required("agent", "admin")
def delete_trip_package(current_user, trip_id):
    trip = TripPackage.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip package not found."}), 404

    if current_user.role == "agent" and trip.agent_id != current_user.id:
        return jsonify({"error": "You do not own this trip package."}), 403

    db.session.delete(trip)
    db.session.commit()
    return jsonify({"message": "Trip package deleted."}), 200
