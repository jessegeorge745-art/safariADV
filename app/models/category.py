"""
app/models/category.py — Category (Safari, Beach, City Break, etc.) and the
many-to-many join table linking trip packages to categories.
"""

from app.extensions import db

trip_package_categories = db.Table(
    "trip_package_categories",
    db.Column("trip_package_id", db.Integer, db.ForeignKey("trip_packages.id"), primary_key=True),
    db.Column("category_id", db.Integer, db.ForeignKey("categories.id"), primary_key=True),
)


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "slug": self.slug}

    def __repr__(self):
        return f"<Category {self.name}>"