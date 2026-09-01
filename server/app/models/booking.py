from datetime import datetime, timezone

from app.extensions import db

BOOKING_STATUSES = ("pending", "confirmed", "completed", "cancelled")
PAYMENT_STATUSES = ("unpaid", "paid", "failed", "refunded")


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)

    # Null user_id means a guest booking - guest_* fields are required instead.
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    trip_package_id = db.Column(
        db.Integer, db.ForeignKey("trip_packages.id"), nullable=False
    )

    guest_name = db.Column(db.String(120), nullable=True)
    guest_email = db.Column(db.String(255), nullable=True)
    guest_phone = db.Column(db.String(30), nullable=True)

    spots = db.Column(db.Integer, nullable=False, default=1)

    # Two independent status fields - don't confuse them.
    # status: pending -> confirmed -> completed (or cancelled)
    status = db.Column(db.String(20), nullable=False, default="pending")
    # payment_status: unpaid -> paid/failed -> refunded
    payment_status = db.Column(db.String(20), nullable=False, default="unpaid")

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Added for the reviews update: lets reviews.py do booking.user.name
    # instead of a manual second query.
    user = db.relationship("User", backref="bookings", lazy=True)

    review = db.relationship(
        "Review", backref="booking", uselist=False, cascade="all, delete-orphan"
    )

    def to_dict(self, include_trip=True):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "trip_package_id": self.trip_package_id,
            "guest_name": self.guest_name,
            "guest_email": self.guest_email,
            "guest_phone": self.guest_phone,
            "spots": self.spots,
            "status": self.status,
            "payment_status": self.payment_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "traveler_name": self.guest_name or (self.user.name if self.user else None),
        }
        if include_trip and self.trip_package:
            data["trip_package"] = {
                "id": self.trip_package.id,
                "title": self.trip_package.title,
                "destination": self.trip_package.destination,
                "start_date": self.trip_package.start_date.isoformat()
                if self.trip_package.start_date
                else None,
                "end_date": self.trip_package.end_date.isoformat()
                if self.trip_package.end_date
                else None,
                "image_url": self.trip_package.image_url,
            }
        return data

    def __repr__(self):
        return f"<Booking {self.id} trip={self.trip_package_id} status={self.status}>"
