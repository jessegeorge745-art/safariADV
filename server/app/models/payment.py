from datetime import datetime, timezone

from app.extensions import db

# pending: STK push sent, waiting on the Safaricom callback.
# success / failed: resolved by the callback.
# cancelled: user dismissed the STK prompt on their phone (ResultCode 1032).
PAYMENT_STATUSES = ("pending", "success", "failed", "cancelled")


class Payment(db.Model):
    """
    One row per M-Pesa STK Push attempt. A booking can have several rows
    here if a first attempt fails/times out and the traveler retries -
    Booking.payment_status only gets flipped to "paid" once one of these
    resolves with status="success".
    """

    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False)

    phone = db.Column(db.String(15), nullable=False)  # normalized 2547XXXXXXXX
    amount = db.Column(db.Numeric(10, 2), nullable=False)

    # Identifiers returned by Safaricom when the STK push is initiated -
    # the callback is matched back to this row via checkout_request_id.
    merchant_request_id = db.Column(db.String(100), nullable=True)
    checkout_request_id = db.Column(db.String(100), nullable=True, index=True)

    status = db.Column(db.String(20), nullable=False, default="pending")
    result_code = db.Column(db.String(10), nullable=True)
    result_desc = db.Column(db.Text, nullable=True)
    mpesa_receipt_number = db.Column(db.String(40), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    booking = db.relationship(
        "Booking",
        backref=db.backref("payments", cascade="all, delete-orphan"),
        lazy=True,
    )

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "phone": self.phone,
            "amount": float(self.amount) if self.amount is not None else None,
            "checkout_request_id": self.checkout_request_id,
            "status": self.status,
            "result_desc": self.result_desc,
            "mpesa_receipt_number": self.mpesa_receipt_number,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Payment {self.id} booking={self.booking_id} status={self.status}>"
