# SafariADV Backend

Flask + PostgreSQL API for the SafariADV frontend (traveler / agent / admin
roles, trip packages, bookings, admin oversight).

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then edit DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD
python seed.py                    # creates tables + first admin + categories
python run.py                     # starts the API on http://localhost:5000
```

`DATABASE_URL` must point at a running Postgres database you've already
created (`createdb safariadv_db` or via `psql`) — `seed.py` creates the
*tables* inside it, not the database itself.

To confirm it's running: open `http://localhost:5000/api/trip_packages` —
you should get back `[]` (empty list, no trips yet).

Connect the frontend by setting, in the frontend's `.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

(This matches the default `client.js` already falls back to, so it'll work
even without a frontend `.env` as long as the backend runs on port 5000.)

## Project layout

```
app/
  config.py       settings, read from environment (no hardcoded values)
  extensions.py   shared db/migrate/jwt/mail/bcrypt/cors instances
  __init__.py     app factory — create_app()
  models/         User, TripPackage, Booking, Category, Setting
  routes/         auth, trip_packages, bookings, admin — one Blueprint each
  utils/          role_required decorator, password-reset tokens, mailer
run.py            entry point
seed.py           creates tables + first admin + default categories/settings
```

## API summary

**Auth** (`/api/auth`)
- `POST /traveler/register` `{name, email, phone?, password}`
- `POST /agent/register` `{name, email, phone?, password, business_name?}` — starts `pending`, needs admin approval
- `POST /traveler/login` | `/agent/login` | `/admin/login` `{email, password}` → `{user, access_token, refresh_token}`
- `POST /refresh` — `Authorization: Bearer <refresh_token>` → new token pair
- `PUT /me` — update your own profile (any logged-in role)
- `POST /forgot-password` `{email}`, `POST /reset-password` `{token, password}`

**Trip packages** (`/api/trip_packages`)
- `GET ""` — public sees only `approved` (+ filters: `destination`, `min_price`, `max_price`, `start_after`, `category_id`); agents see only their own; admins see all
- `GET /<id>` — 404s if not approved and you're not the owning agent/admin
- `POST ""` — agent only, creates as `pending`
- `PUT /<id>` — owning agent or admin; agent edits on an approved trip send it back to `pending`
- `DELETE /<id>` — owning agent or admin; blocked if the trip has bookings
- `GET /categories` — public

**Bookings** (`/api/bookings`)
- `POST ""` — traveler (if logged in) or guest (`guest_name`/`guest_email`/`guest_phone`); `{trip_package_id, seats, ...}`
- `GET ""` — scoped: traveler sees own, agent sees bookings on their trips, admin sees all; filters `trip_package_id`, `status`
- `GET /<id>` / `PUT /<id>` `{status}` — status transitions (`pending→confirmed→completed`, or `→cancelled`); confirming books the seats, cancelling a confirmed booking frees them
- `PUT /<id>/payment` `{payment_status}` — agent/admin only

**Admin** (`/api/admin`)
- `GET/PUT/DELETE /users/<id>`, `GET /users` (filter `role`, `status`) — `PUT {"status":"active"}` is how you approve a pending agent
- `PUT /trip_packages/<id>/approve|reject|blacklist`
- `GET /bookings` — all bookings, filters `status`, `payment_status`
- `GET /reports` — revenue, booking counts, top trips, top destinations
- `GET /settings/<key>` (public) / `PUT /settings/<key>` (admin) — e.g. `cancellation_policy`

## Testing an endpoint without the frontend

```bash
curl -X POST http://localhost:5000/api/auth/traveler/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

curl -X POST http://localhost:5000/api/auth/traveler/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

curl http://localhost:5000/api/bookings \
  -H "Authorization: Bearer <paste access_token here>"
```

If something 403s that shouldn't: check the role on the token, the roles
listed in `role_required(...)` on that route, and whether the user's
`status` is `active`.

## Notes on the current implementation

- **Capacity is enforced at confirm-time, not at request-time.** A `pending`
  booking doesn't reserve a seat — `spots_booked` only increments when a
  booking moves to `confirmed`, and that transition re-checks
  `spots_remaining` first. This is a reasonable tradeoff for a project this
  size, but it does mean two pending requests for the last seat can both be
  accepted; only the first *confirm* wins. Worth knowing if that matters for
  your use case.
- **Image uploads are base64 data URLs from the frontend today** (see
  `ImageUploadField.jsx`), stored directly in `trip_packages.image_url`.
  That works with zero backend changes, but bloats the DB row and the JSON
  payload. If you want real file uploads later, add a
  `POST /api/trip_packages/<id>/image` multipart endpoint that saves to
  disk/S3 and returns a URL, and switch `ImageUploadField` to call it
  instead of `FileReader.readAsDataURL`.
- **Weather widget needs no backend work** — `src/api/weather.js` calls
  Open-Meteo directly from the browser (no API key required), so there's
  nothing to proxy.