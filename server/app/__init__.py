from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, jwt, bcrypt, mail, cors


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)

    from app.routes.auth import auth_bp
    from app.routes.trip_packages import trip_packages_bp
    from app.routes.bookings import bookings_bp
    from app.routes.admin import admin_bp
    from app.routes.payments import payments_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(trip_packages_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(payments_bp)

    # No DB access - lets you tell "the app is up" apart from "the DB is
    # broken" when a deploy is misbehaving (e.g. bad DATABASE_URL).
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    return app