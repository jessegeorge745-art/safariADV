from datetime import datetime, timezone

from app.extensions import db


class Favorite(db.Model):
    """
    A traveler bookmarking a trip package.

    backref'd from both sides - see TripPackage.favorited_by and
    User.favorites - so this model only needs to define the columns;
    the two convenience attributes (favorite.trip_package, favorite.user)
    are created automatically.
    """

    __tablename__ = "favorites"
    __table_args__ = (
        db.UniqueConstraint("user_id", "trip_package_id", name="uq_favorite_user_trip"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    trip_package_id = db.Column(
        db.Integer, db.ForeignKey("trip_packages.id"), nullable=False
    )

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "trip_package_id": self.trip_package_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Favorite user={self.user_id} trip={self.trip_package_id}>"