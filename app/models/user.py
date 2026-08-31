"""
app/models/user.py — the User table.

role   : traveler | agent | admin
status : active | pending | deactivated

- Travelers get status="active" immediately on registration.
- Agents get status="pending" — they cannot log in until an admin flips
  them to "active" via PUT /api/admin/users/<id>.
- Admins are only ever created via seed.py (there is no public admin
  registration route).
- phone is optional (nullable=True) on every role.
- business_name is only meaningful for agents but stored on every row for
  simplicity; it's null for travelers/admins.

to_dict() controls exactly which fields are sent to the frontend as JSON.
If you add a column and it's not showing up in the API response, you
forgot to add it here.
"""

from datetime import datetime, timezone

from app.extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    phone = db.Column(db.String(30), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)

    role = db.Column(db.String(20), nullable=False)  # traveler | agent | admin
    status = db.Column(db.String(20), nullable=False, default="active")  # active | pending | deactivated

    business_name = db.Column(db.String(200), nullable=True)  # agents only

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    trip_packages = db.relationship("TripPackage", backref="agent", lazy="dynamic")
    bookings = db.relationship("Booking", backref="traveler", lazy="dynamic")

    # --- password helpers --------------------------------------------------
    def set_password(self, raw_password):
        self.password_hash = bcrypt.generate_password_hash(raw_password).decode("utf-8")

    def check_password(self, raw_password):
        return bcrypt.check_password_hash(self.password_hash, raw_password)

    # --- serialization -------------------------------------------------
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "status": self.status,
            "business_name": self.business_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<User {self.id} {self.email} ({self.role})>"