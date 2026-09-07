from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.category import Category

app = create_app()

with app.app_context():
    db.create_all()

    admin_email = app.config["ADMIN_EMAIL"]
    if not User.query.filter_by(email=admin_email).first():
        admin = User(
            name=app.config["ADMIN_NAME"],
            email=admin_email,
            role="admin",
            status="active",
        )
        admin.set_password(app.config["ADMIN_PASSWORD"])
        db.session.add(admin)

    default_categories = [
        ("Wildlife", "wildlife"),
        ("Beach", "beach"),
        ("Mountain", "mountain"),
        ("Cultural", "cultural"),
        ("Adventure", "adventure"),
    ]
    for name, slug in default_categories:
        if not Category.query.filter_by(slug=slug).first():
            db.session.add(Category(name=name, slug=slug))

    db.session.commit()
    print("Seed complete.")