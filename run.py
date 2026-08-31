"""
run.py — starts the API on http://localhost:5000

    python run.py
"""

import os
from dotenv import load_dotenv

load_dotenv()  # reads .env before app/config.py reads os.environ

from app import create_app  # noqa: E402

app = create_app()

if __name__ == "__main__":
    debug = os.environ.get("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=debug)