import re

# Accepts any of: 0712345678, 712345678, +254712345678, 254712345678
# (07xx/01xx Safaricom-style numbers) and normalizes to 2547XXXXXXXX /
# 2541XXXXXXXX, which is the only format Daraja's STK Push accepts.
_KENYAN_MOBILE_RE = re.compile(r"^(?:\+?254|0)?(7\d{8}|1\d{8})$")


def normalize_kenyan_phone(raw):
    """Returns the 2547XXXXXXXX-format phone number, or None if invalid."""
    if not raw:
        return None
    digits = re.sub(r"[^\d+]", "", raw.strip())
    match = _KENYAN_MOBILE_RE.match(digits)
    if not match:
        return None
    return f"254{match.group(1)}"
