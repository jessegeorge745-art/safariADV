"""
app/extensions.py — shared library instances.

Created here (not inside create_app()) so that app/models/*.py and
app/routes/*.py can do `from app.extensions import db` without triggering
a circular import with app/__init__.py.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_bcrypt import Bcrypt
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()
bcrypt = Bcrypt()
cors = CORS()