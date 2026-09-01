from app.extensions import db

# Many-to-many join table between trip_packages and categories.
trip_package_categories = db.Table(
    "trip_package_categories",
    db.Column(
        "trip_package_id",
        db.Integer,
        db.ForeignKey("trip_packages.id"),
        primary_key=True,
    ),
    db.Column(
        "category_id", db.Integer, db.ForeignKey("categories.id"), primary_key=True
    ),
)


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False, unique=True)  # Safari, Beach, City Break, ...
    slug = db.Column(db.String(80), nullable=False, unique=True)

    trip_packages = db.relationship(
        "TripPackage", secondary=trip_package_categories, back_populates="categories"
    )

    def to_dict(self):
        return {"id": self.id, "name": self.name, "slug": self.slug}

    def __repr__(self):
        return f"<Category {self.name}>"
