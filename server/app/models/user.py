from datetime import datetime, timezone

from app.extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(30), nullable=True)

    role = db.Column(db.String(20), nullable=False)  # traveler | agent | admin

    # Travelers get "active" immediately on registration.
    # Agents get "pending" and physically cannot log in until an admin
    # flips them to "active" via PUT /api/admin/users/<id>.
    status = db.Column(db.String(20), nullable=False, default="active")

    # Only meaningful for role == "agent"
    business_name = db.Column(db.String(150), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    trip_packages = db.relationship(
        "TripPackage", backref="agent", lazy=True, foreign_keys="TripPackage.agent_id"
    )
    favorites = db.relationship(
        "Favorite", backref="user", lazy=True, cascade="all, delete-orphan"
    )

    # --- password helpers ---
    def set_password(self, raw_password):
        self.password_hash = bcrypt.generate_password_hash(raw_password).decode("utf-8")

    def check_password(self, raw_password):
        return bcrypt.check_password_hash(self.password_hash, raw_password)

    # --- serialization ---
    def to_dict(self, include_business=True):
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_business and self.role == "agent":
            data["business_name"] = self.business_name
        return data

    def __repr__(self):
        return f"<User {self.id} {self.email} role={self.role}>"
