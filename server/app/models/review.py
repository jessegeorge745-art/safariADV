from datetime import datetime, timezone

from app.extensions import db


class Review(db.Model):
    """
    A traveler's review of a completed trip package.

    One review per booking (Booking.review is a uselist=False backref, so
    booking_id must be unique). backref'd from TripPackage.reviews too,
    which is what powers TripPackage.average_rating / review_count.
    """

    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(
        db.Integer, db.ForeignKey("bookings.id"), nullable=False, unique=True
    )
    trip_package_id = db.Column(
        db.Integer, db.ForeignKey("trip_packages.id"), nullable=False
    )

    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "trip_package_id": self.trip_package_id,
            "rating": self.rating,
            "comment": self.comment,
            "traveler_name": self.booking.user.name
            if self.booking and self.booking.user
            else (self.booking.guest_name if self.booking else None),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Review {self.id} trip={self.trip_package_id} rating={self.rating}>"