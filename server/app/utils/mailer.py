import logging

from flask import current_app
from flask_mail import Message

from app.extensions import mail

logger = logging.getLogger(__name__)


def _send(subject, recipient, body):
    """
    Shared send path. Swallows and logs mail errors instead of raising, so a
    misconfigured/unreachable SMTP server (very common in dev) doesn't turn
    a registration or booking into a 500 - the user still gets their normal
    response, they just don't get the email.
    """
    if not recipient:
        return
    try:
        msg = Message(
            subject=subject,
            recipients=[recipient],
            body=body,
            sender=current_app.config.get("MAIL_USERNAME"),
        )
        mail.send(msg)
    except Exception:
        logger.exception("Failed to send email to %s", recipient)


def send_password_reset_email(user, reset_url):
    _send(
        subject="Reset your SafariADV password",
        recipient=user.email,
        body=(
            f"Hi {user.name},\n\n"
            "We received a request to reset your SafariADV password. "
            f"Click the link below to choose a new one:\n\n{reset_url}\n\n"
            "This link expires in 1 hour. If you didn't request this, "
            "you can safely ignore this email.\n\n- SafariADV"
        ),
    )


def send_booking_confirmation(booking):
    recipient = booking.guest_email or (booking.user.email if booking.user else None)
    traveler_name = booking.guest_name or (booking.user.name if booking.user else "there")
    trip = booking.trip_package

    _send(
        subject="Your SafariADV booking is confirmed",
        recipient=recipient,
        body=(
            f"Hi {traveler_name},\n\n"
            f"Your booking for \"{trip.title if trip else 'your trip'}\" "
            f"({booking.spots} spot{'s' if booking.spots != 1 else ''}) has been received.\n\n"
            f"Booking ID: {booking.id}\n"
            f"Status: {booking.status}\n\n"
            "We'll notify you if anything about your booking changes.\n\n- SafariADV"
        ),
    )