import logging

from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models.booking import Booking
from app.models.payment import Payment
from app.utils.daraja import stk_push, DarajaError
from app.utils.phone import normalize_kenyan_phone

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")
logger = logging.getLogger(__name__)


@payments_bp.route("/mpesa/stkpush", methods=["POST"])
def initiate_stk_push():
    """
    Kicks off an M-Pesa STK push for a booking. Public (not @login_required)
    because guest bookings - which never have an account - need to be able
    to pay too; the booking_id + it already being unpaid is all we check.
    """
    data = request.get_json(silent=True) or {}
    booking_id = data.get("booking_id")
    booking = Booking.query.get(booking_id) if booking_id else None
    if not booking:
        return jsonify({"error": "Booking not found."}), 404

    if booking.payment_status == "paid":
        return jsonify({"error": "This booking has already been paid for."}), 400

    phone = normalize_kenyan_phone(data.get("phone") or booking.guest_phone)
    if not phone:
        return jsonify(
            {"error": "A valid Safaricom phone number is required (e.g. 07XXXXXXXX)."}
        ), 400

    payment = Payment(
        booking_id=booking.id,
        phone=phone,
        amount=booking.total_amount,
        status="pending",
    )
    db.session.add(payment)
    db.session.commit()

    try:
        result = stk_push(
            phone=phone,
            amount=booking.total_amount,
            account_reference=f"SafariADV{booking.id}",
            transaction_desc="SafariADV trip booking",
        )
    except DarajaError as e:
        payment.status = "failed"
        payment.result_desc = str(e)
        db.session.commit()
        return jsonify({"error": str(e)}), 502

    payment.merchant_request_id = result.get("MerchantRequestID")
    payment.checkout_request_id = result.get("CheckoutRequestID")
    db.session.commit()

    return jsonify(
        {
            "payment": payment.to_dict(),
            "customer_message": result.get(
                "CustomerMessage", "Check your phone to complete the M-Pesa payment."
            ),
        }
    ), 201


@payments_bp.route("/mpesa/status/<checkout_request_id>", methods=["GET"])
def get_stk_push_status(checkout_request_id):
    """Polled by the frontend after initiate_stk_push while it waits for
    the callback below to resolve the payment."""
    payment = Payment.query.filter_by(checkout_request_id=checkout_request_id).first()
    if not payment:
        return jsonify({"error": "Payment not found."}), 404
    return jsonify(payment.to_dict()), 200


@payments_bp.route("/mpesa/callback", methods=["POST"])
def mpesa_callback():
    """
    Safaricom POSTs the outcome here once the traveler enters their PIN (or
    cancels/times out) - configured as MPESA_CALLBACK_URL, must be a public
    HTTPS URL (a local backend needs a tunnel, e.g. ngrok, for this to be
    reachable during development).

    Always returns 200 - Safaricom retries on anything else, which would
    just resend the same callback repeatedly.
    """
    payload = request.get_json(silent=True) or {}
    callback = (payload.get("Body") or {}).get("stkCallback") or {}
    checkout_request_id = callback.get("CheckoutRequestID")
    result_code = callback.get("ResultCode")
    result_desc = callback.get("ResultDesc")

    payment = Payment.query.filter_by(checkout_request_id=checkout_request_id).first()
    if not payment:
        logger.warning("M-Pesa callback for unknown CheckoutRequestID=%s", checkout_request_id)
        return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200

    payment.result_code = str(result_code)
    payment.result_desc = result_desc

    if result_code == 0:
        items = ((callback.get("CallbackMetadata") or {}).get("Item")) or []
        metadata = {item.get("Name"): item.get("Value") for item in items}

        payment.status = "success"
        payment.mpesa_receipt_number = metadata.get("MpesaReceiptNumber")

        payment.booking.payment_status = "paid"
    else:
        # 1032 = user cancelled/dismissed the prompt on their phone.
        payment.status = "cancelled" if result_code == 1032 else "failed"

    db.session.commit()
    return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200
