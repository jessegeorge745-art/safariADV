from flask import Flask
from app.config import Config
from app.extensions import db, jwt, bcrypt, mail, cors


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)
    cors.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.trip_packages import trip_packages_bp
    from app.routes.bookings import bookings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(trip_packages_bp)
    app.register_blueprint(bookings_bp)

    return app
