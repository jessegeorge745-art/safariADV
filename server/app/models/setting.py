from datetime import datetime, timezone

from app.extensions import db


class Setting(db.Model):
    """
    Generic key-value table for admin-editable settings, one row per key.
    e.g. key="cancellation_policy", value="Free cancellation up to 48h..."
    """

    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), nullable=False, unique=True, index=True)
    value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {"key": self.key, "value": self.value}

    def __repr__(self):
        return f"<Setting {self.key}>"
