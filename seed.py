"""
seed.py — creates tables + first admin + categories.

    python seed.py

DATABASE_URL must already point at a Postgres database that exists
(createdb safariadv_db, or CREATE DATABASE safariadv_db; in psql) —
this script creates the TABLES inside it, not the database itself.

Safe to re-run: it checks for existing rows before inserting, so running
it twice won't create duplicate admins or categories.
"""

import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import User, Category, Setting  # noqa: E402

DEFAULT_CATEGORIES = [
    ("Safari", "safari"),
    ("Beach", "beach"),
    ("City Break", "city-break"),
    ("Mountain & Hiking", "mountain-hiking"),
    ("Cultural", "cultural"),
    ("Wildlife", "wildlife"),
]

DEFAULT_SETTINGS = {
    "cancellation_policy": (
        "Free cancellation up to 14 days before the trip start date. "
        "Cancellations within 14 days are non-refundable unless the trip "
        "itself is cancelled by the operator."
    ),
}


def seed():
    app = create_app()
    with app.app_context():
        print("Creating tables (if they don't already exist)...")
        db.create_all()

        admin_email = app.config["ADMIN_EMAIL"]
        if User.query.filter_by(email=admin_email).first():
            print(f"Admin already exists ({admin_email}), skipping.")
        else:
            admin = User(
                name=app.config["ADMIN_NAME"],
                email=admin_email,
                role="admin",
                status="active",
            )
            admin.set_password(app.config["ADMIN_PASSWORD"])
            db.session.add(admin)
            print(f"Created admin: {admin_email}")

        for name, slug in DEFAULT_CATEGORIES:
            if not Category.query.filter_by(slug=slug).first():
                db.session.add(Category(name=name, slug=slug))
                print(f"Created category: {name}")

        for key, value in DEFAULT_SETTINGS.items():
            if not Setting.query.filter_by(key=key).first():
                db.session.add(Setting(key=key, value=value))
                print(f"Created setting: {key}")

        db.session.commit()
        print("Seed complete.")


if __name__ == "__main__":
    seed()