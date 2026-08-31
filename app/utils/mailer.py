import logging

from flask import current_app
from flask_mail import Message

from app.extensions import mail

logger = logging.getLogger(__name__)


def _safe_send(msg):
    try:
        mail.send(msg)
        return True
    except Exception as exc:  # noqa: BLE001 - intentional broad catch, see docstring
        logger.warning("Email send failed (this is expected without real MAIL_* creds): %s", exc)
        return False


def send_booking_confirmation(booking):
    to_email = booking.contact_email()
    if not to_email:
        return False

    trip = booking.trip_package
    msg = Message(
        subject=f"Booking confirmation — {trip.title if trip else 'Your trip'}",
        recipients=[to_email],
        body=(
            f"Hi {booking.contact_name() or 'there'},\n\n"
            f"Your booking (#{booking.id}) for \"{trip.title if trip else ''}\" "
            f"is {booking.status}. Seats: {booking.seats}. "
            f"Total: {booking.total_price}.\n\n"
            f"— SafariADV"
        ),
        sender=current_app.config.get("MAIL_DEFAULT_SENDER"),
    )
    return _safe_send(msg)


def send_password_reset_email(to_email, reset_url):
    msg = Message(
        subject="Reset your SafariADV password",
        recipients=[to_email],
        body=(
            f"We received a request to reset your password.\n\n"
            f"Reset it here: {reset_url}\n\n"
            f"If you didn't request this, you can ignore this email."
        ),
        sender=current_app.config.get("MAIL_DEFAULT_SENDER"),
    )
    return _safe_send(msg)