from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.category import Category

app = create_app()

with app.app_context():
    db.create_all()

    if not User.query.filter_by(email="admin@safariadv.com").first():
        admin = User(
            name="Admin",
            email="admin@safariadv.com",
            role="admin",
            status="active",
        )
        admin.set_password("changeme123")
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
