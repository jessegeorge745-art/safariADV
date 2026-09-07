# SafariADV

A trip-booking platform with three roles — traveler, agent, admin — plus
guest checkout. React + Vite frontend, Flask + SQLAlchemy backend, M-Pesa
Daraja (STK Push) for payments.

## Project structure

```
/              React + Vite frontend (src/)
/server        Flask backend (app/)
```

## Local development

### Backend

```bash
cd server
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then fill in the values (see below)
python seed.py               # creates tables + the first admin account
python run.py                # http://localhost:5000
```

`seed.py` reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` to create the
first admin login — change the password before deploying anywhere real.

By default the backend uses a local `sqlite:///app.db` file (no Postgres
needed for local dev) — set `DATABASE_URL` to point at Postgres once you
deploy.

### Frontend

```bash
npm install
cp .env.example .env         # VITE_API_BASE_URL defaults to the local backend above
npm run dev                  # http://localhost:5173
```

## M-Pesa Daraja (STK Push)

Payments use Safaricom's Daraja API. The backend ships with Safaricom's
published **sandbox** test shortcode/passkey as defaults
(`server/app/config.py`), so STK pushes work against the sandbox once you
have a Daraja app's Consumer Key/Secret — no other setup required for
testing.

1. Create a free account at https://developer.safaricom.co.ke and add an
   app under "My Apps" — this gives you a **Consumer Key** and
   **Consumer Secret** for the sandbox.
2. Set them in `server/.env`:
   ```
   MPESA_ENV=sandbox
   MPESA_CONSUMER_KEY=...
   MPESA_CONSUMER_SECRET=...
   ```
3. Set `MPESA_CALLBACK_URL` to a **publicly reachable** HTTPS URL —
   Safaricom POSTs the payment result there and cannot reach `localhost`.
   - Deployed: `https://<your-backend-domain>/api/payments/mpesa/callback`
   - Local dev: run a tunnel, e.g. `ngrok http 5000`, and use the
     `https://...ngrok-free.app/api/payments/mpesa/callback` URL it gives you.
4. Test with Safaricom's sandbox test MSISDN (`254708374149`) and any
   amount — the STK prompt is simulated, no real phone/money involved.

**Going to production**: register a Paybill/Till with Safaricom, create a
*production* app on the Daraja portal, and set `MPESA_ENV=production` plus
your real `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` /
`MPESA_SHORTCODE` / `MPESA_PASSKEY` — the sandbox defaults only work
against the sandbox.

How it fits together: `POST /api/payments/mpesa/stkpush` (called from the
booking page when "M-Pesa" is selected) creates a `Payment` row and sends
the STK push; `POST /api/payments/mpesa/callback` is where Safaricom
reports the result and flips the booking to `payment_status: "paid"`; the
frontend polls `GET /api/payments/mpesa/status/<checkout_request_id>` in
the meantime to show progress.

## Deployment

### Backend → Render

`server/render.yaml` is a ready-to-use
[Render Blueprint](https://render.com/docs/blueprint-spec): in the Render
dashboard choose **New → Blueprint**, point it at this repo (root
directory `server`), and it provisions the web service + a free Postgres
database. Fill in the secrets it asks for (`CORS_ORIGINS`, `FRONTEND_URL`,
`ADMIN_EMAIL`/`ADMIN_PASSWORD`, the `MPESA_*` vars). After the first
deploy, open the service's **Shell** tab and run `python seed.py` once to
create the tables and the admin account.

(Railway or Fly.io work too — same `requirements.txt` / `gunicorn run:app`
start command; render.yaml just saves you the manual setup on Render
specifically.)

### Frontend → Vercel

`vercel.json` at the repo root configures the SPA rewrite React Router
needs. In Vercel, **New Project** → import this repo → set the
environment variable `VITE_API_BASE_URL` to your deployed backend's URL
plus `/api` (e.g. `https://safariadv-api.onrender.com/api`) → Deploy.

Once both are live, set the backend's `CORS_ORIGINS` and `FRONTEND_URL`
to the Vercel URL, and `MPESA_CALLBACK_URL` to the Render URL's
`/api/payments/mpesa/callback`, then redeploy the backend.

## Known limitations

- `npm run lint` reports pre-existing `react-hooks/set-state-in-effect`
  findings across most data-fetching pages (e.g. `pages/admin/Users.jsx`,
  `pages/public/TripPackages.jsx`). These are the standard
  "fetch-on-mount" pattern used throughout the app and work correctly at
  runtime; the installed `eslint-plugin-react-hooks` version flags this
  pattern as an error. Not touched in this pass since fixing it means
  restructuring every data-fetching page's effect, not a functional bug.
