"""
Thin wrapper around Safaricom's Daraja API for M-Pesa STK Push
("Lipa Na M-Pesa Online").

All the pieces Daraja needs live in Config (see app/config.py /
server/.env.example):
  MPESA_ENV              "sandbox" or "production" - picks the base URL
  MPESA_CONSUMER_KEY     from your app on developer.safaricom.co.ke
  MPESA_CONSUMER_SECRET  "
  MPESA_SHORTCODE        Paybill/Till number (sandbox default: 174379)
  MPESA_PASSKEY           Lipa Na M-Pesa Online passkey for that shortcode
  MPESA_CALLBACK_URL     publicly reachable URL Safaricom POSTs the result
                          to - see routes/payments.py:mpesa_callback

The sandbox defaults below are Safaricom's own published test credentials
(the shortcode 174379 and its passkey are documented publicly in the
Daraja docs) so STK pushes work out of the box against the sandbox
without anyone having to configure anything first.
"""

import base64
import logging
from datetime import datetime

import requests
from flask import current_app

logger = logging.getLogger(__name__)

SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke"
PRODUCTION_BASE_URL = "https://api.safaricom.co.ke"

# Safaricom's published sandbox test shortcode + passkey - safe to ship as
# defaults since they only work against the sandbox environment.
DEFAULT_SANDBOX_SHORTCODE = "174379"
DEFAULT_SANDBOX_PASSKEY = (
    "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
)


class DarajaError(Exception):
    """Raised when Daraja rejects a request (bad credentials, bad phone, etc)."""


def _base_url():
    env = current_app.config.get("MPESA_ENV", "sandbox")
    return PRODUCTION_BASE_URL if env == "production" else SANDBOX_BASE_URL


def get_access_token():
    key = current_app.config["MPESA_CONSUMER_KEY"]
    secret = current_app.config["MPESA_CONSUMER_SECRET"]
    if not key or not secret:
        raise DarajaError(
            "M-Pesa is not configured: set MPESA_CONSUMER_KEY / "
            "MPESA_CONSUMER_SECRET (see server/.env.example)."
        )

    url = f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials"
    resp = requests.get(url, auth=(key, secret), timeout=15)
    if not resp.ok:
        logger.error("Daraja token request failed: %s %s", resp.status_code, resp.text)
        raise DarajaError("Could not authenticate with M-Pesa. Try again shortly.")

    return resp.json()["access_token"]


def _password(shortcode, passkey, timestamp):
    raw = f"{shortcode}{passkey}{timestamp}".encode("utf-8")
    return base64.b64encode(raw).decode("utf-8")


def stk_push(phone, amount, account_reference, transaction_desc):
    """
    Triggers the STK push prompt on the traveler's phone.

    phone must already be normalized to 2547XXXXXXXX (see utils/phone.py).
    Returns Safaricom's response dict, which includes MerchantRequestID
    and CheckoutRequestID - both needed to match the async callback back
    to this payment.
    """
    token = get_access_token()
    shortcode = current_app.config["MPESA_SHORTCODE"]
    passkey = current_app.config["MPESA_PASSKEY"]
    callback_url = current_app.config["MPESA_CALLBACK_URL"]
    if not callback_url:
        raise DarajaError(
            "MPESA_CALLBACK_URL is not set - Safaricom needs a public URL "
            "to POST the payment result to (see server/.env.example)."
        )

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

    payload = {
        "BusinessShortCode": shortcode,
        "Password": _password(shortcode, passkey, timestamp),
        "Timestamp": timestamp,
        "TransactionType": current_app.config.get(
            "MPESA_TRANSACTION_TYPE", "CustomerPayBillOnline"
        ),
        # Whole shillings only - Daraja rejects fractional amounts.
        "Amount": int(round(float(amount))),
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": callback_url,
        "AccountReference": str(account_reference)[:12],
        "TransactionDesc": transaction_desc[:13],
    }

    url = f"{_base_url()}/mpesa/stkpush/v1/processrequest"
    resp = requests.post(
        url,
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    data = resp.json() if resp.content else {}

    if not resp.ok or data.get("ResponseCode") not in (None, "0"):
        message = data.get("errorMessage") or data.get("CustomerMessage") or resp.text
        logger.error("Daraja STK push failed: %s", message)
        raise DarajaError(message or "M-Pesa could not process this payment request.")

    return data
