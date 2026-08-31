"""
app/models/setting.py — a generic key-value table for admin-editable
settings, e.g. the cancellation policy text. One row per setting key.
"""

from app.extensions import db

# Keys the app knows about / seeds by default. Not enforced — routes/admin.py
# will happily read or write any key, this is just documentation.
CANCELLATION_POLICY_KEY = "cancellation_policy"


class Setting(db.Model):
    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), nullable=False, unique=True, index=True)
    value = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {"key": self.key, "value": self.value}

    def __repr__(self):
        return f"<Setting {self.key}>"