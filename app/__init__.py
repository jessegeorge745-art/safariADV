"""
create_app() is the function that builds the actual Flask app:
  1. Reads config from config.py
  2. Calls .init_app() on every extension from extensions.py
  3. Registers every blueprint (auth_bp, trip_packages_bp, bookings_bp, admin_bp)

If you add a brand-new route file with its own Blueprint, you must import
and app.register_blueprint(...) it here, or none of its routes will exist.
"""

from flask import Flask, jsonify

from app.config import Config
from app.extensions import db, migrate, jwt, mail, bcrypt, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # --- extensions -----------------------------------------------------
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)

    # Make sure models are registered with SQLAlchemy/Flask-Migrate
    from app import models  # noqa: F401

    # --- blueprints -------------------------------------------------------
    from app.routes.auth import auth_bp
    from app.routes.trip_packages import trip_packages_bp
    from app.routes.bookings import bookings_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(trip_packages_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(admin_bp)

    # --- JWT error handlers (return JSON, not HTML, for a consistent API) --
    @jwt.unauthorized_loader
    def _missing_token(reason):
        return jsonify({"error": "Authentication required."}), 401

    @jwt.invalid_token_loader
    def _invalid_token(reason):
        return jsonify({"error": "Invalid authentication token."}), 401

    @jwt.expired_token_loader
    def _expired_token(jwt_header, jwt_payload):
        return jsonify({"error": "Your session has expired. Please log in again."}), 401

    # --- generic error handlers --------------------------------------------
    @app.errorhandler(404)
    def _not_found(e):
        return jsonify({"error": "Not found."}), 404

    @app.errorhandler(405)
    def _method_not_allowed(e):
        return jsonify({"error": "Method not allowed."}), 405

    @app.errorhandler(500)
    def _server_error(e):
        return jsonify({"error": "Something went wrong on our end."}), 500

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    return app