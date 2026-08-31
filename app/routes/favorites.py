from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.favorite import Favorite
from app.models.trip_package import TripPackage


favorites_bp = Blueprint("favorites", __name__)


@favorites_bp.get("/api/favorites")
@jwt_required()
def get_favorites():
    current_user_id = get_jwt_identity()

    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity."}), 401

    favorites = (
        Favorite.query
        .filter_by(user_id=current_user_id)
        .order_by(Favorite.created_at.desc())
        .all()
    )

    trips = [
        favorite.trip_package.to_dict()
        for favorite in favorites
        if favorite.trip_package
    ]

    return jsonify({
        "favorites": trips,
        "count": len(trips),
    }), 200


@favorites_bp.post("/api/favorites/<int:trip_id>")
@jwt_required()
def add_favorite(trip_id):
    current_user_id = get_jwt_identity()

    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity."}), 401

    trip_package = TripPackage.query.get(trip_id)

    if not trip_package:
        return jsonify({
            "error": "Trip package not found."
        }), 404

    existing = Favorite.query.filter_by(
        user_id=current_user_id,
        trip_package_id=trip_id,
    ).first()

    if existing:
        return jsonify({
            "error": "Trip is already in your favorites."
        }), 409

    favorite = Favorite(
        user_id=current_user_id,
        trip_package_id=trip_id,
    )

    db.session.add(favorite)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "error": "Trip is already in your favorites."
        }), 409

    return jsonify({
        "message": "Trip added to favorites.",
        "favorite": {
            "id": favorite.id,
            "trip_package_id": favorite.trip_package_id,
        },
    }), 201


@favorites_bp.delete("/api/favorites/<int:trip_id>")
@jwt_required()
def remove_favorite(trip_id):
    current_user_id = get_jwt_identity()

    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity."}), 401

    favorite = Favorite.query.filter_by(
        user_id=current_user_id,
        trip_package_id=trip_id,
    ).first()

    if not favorite:
        return jsonify({
            "error": "Favorite not found."
        }), 404

    db.session.delete(favorite)
    db.session.commit()

    return jsonify({
        "message": "Trip removed from favorites."
    }), 200