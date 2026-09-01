from datetime import datetime, timezone

from app.extensions import db

STATUSES = ("pending", "approved", "rejected", "blacklisted")


class TripPackage(db.Model):
    __tablename__ = "trip_packages"

    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    title = db.Column(db.String(200), nullable=False)
    destination = db.Column(db.String(150), nullable=False)
    itinerary = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    spots_booked = db.Column(db.Integer, nullable=False, default=0)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)

    # pending -> approved / rejected, or blacklisted by an admin at any point
    status = db.Column(db.String(20), nullable=False, default="pending")

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    categories = db.relationship(
        "Category", secondary="trip_package_categories", back_populates="trip_packages"
    )
    bookings = db.relationship(
        "Booking", backref="trip_package", lazy=True, cascade="all, delete-orphan"
    )
    reviews = db.relationship(
        "Review", backref="trip_package", lazy=True, cascade="all, delete-orphan"
    )
    favorited_by = db.relationship(
        "Favorite", backref="trip_package", lazy=True, cascade="all, delete-orphan"
    )

    # computed, not stored, so it can never drift out of sync with spots_booked
    @property
    def spots_remaining(self):
        return max(self.capacity - self.spots_booked, 0)

    # computed fresh on every to_dict(), added in the reviews update
    @property
    def average_rating(self):
        if not self.reviews:
            return None  # not "0" — no reviews yet is different from rated zero
        return round(sum(r.rating for r in self.reviews) / len(self.reviews), 1)

    @property
    def review_count(self):
        return len(self.reviews)

    def to_dict(self, include_agent=True):
        data = {
            "id": self.id,
            "agent_id": self.agent_id,
            "title": self.title,
            "destination": self.destination,
            "itinerary": self.itinerary,
            "price": float(self.price) if self.price is not None else None,
            "capacity": self.capacity,
            "spots_booked": self.spots_booked,
            "spots_remaining": self.spots_remaining,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "image_url": self.image_url,
            "status": self.status,
            "categories": [c.to_dict() for c in self.categories],
            "average_rating": self.average_rating,
            "review_count": self.review_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_agent and self.agent:
            data["agent"] = {
                "id": self.agent.id,
                "name": self.agent.name,
                "business_name": self.agent.business_name,
            }
        return data

    def __repr__(self):
        return f"<TripPackage {self.id} {self.title!r} status={self.status}>"
