# Crochet para el Alma — Rebuild

Phase 1 of the project: public site clone + auth foundation. See
`crochet-para-el-alma-project-spec.md` (shared earlier) for the full roadmap.

## What's included in Phase 1

- **Public site** — Home (hero carousel, founder bio, feature cards, value props,
  CTA banner, podcast block, footer), Clases/Blog/Contacto placeholders,
  Membresía (redirects to your third-party membership platform — edit the URL
  in `frontend/src/pages/Membresia.jsx`).
- **Customer auth** — register/login with email + password, JWT-based, "Mi cuenta"
  page (protected route).
- **Admin dashboard** — separate login at `/admin/login`, protected by role.
  **Hero banner editor is fully working**: add, edit, delete, and show/hide
  carousel slides (image URL, headline, subtext, button text/link).
- **Backend** — FastAPI + MongoDB (Motor), JWT auth, hero slides CRUD API.

## What's included in Phase 2

- **Product CRUD** — `/admin/productos` now lets you add, edit, and delete
  products of three types (physical, digital, course), each with type-specific
  fields (stock for physical, a download link for digital, a placeholder note
  for course — lesson management comes in Phase 3), multiple image URLs, price/
  currency, and an active/hidden toggle.
- **Public store** — `/tienda` now pulls real products from the API, with a
  type filter. The "Comprar" button is disabled with a tooltip explaining
  checkout activates in Phase 4 (once KelvIQ is wired in) — this is intentional,
  not a bug.

## Photos

You mentioned photos will come later — everywhere a real photo goes, there's
a labeled placeholder box (e.g. "Foto de Mónica") so the layout is easy to see
and photos can drop straight in. Once you hand them off, they get uploaded via
the hero editor (banner images) or added to product records (Phase 2).

## Running it locally

### Backend
```bash
cd backend
cp .env.example .env        # edit MONGO_URI if not running Mongo locally
pip install -r requirements.txt --break-system-packages
uvicorn app.main:app --reload --port 8000
```
On first run it creates a MongoDB admin index and one admin account, using
`FIRST_ADMIN_EMAIL` / `FIRST_ADMIN_PASSWORD` from `.env` — **change the
password in `.env` before your first run**, or change it via the API right
after.

You need a MongoDB instance reachable at `MONGO_URI`. For local dev, the
easiest options are a free MongoDB Atlas cluster (no install) or running
`mongod` locally if you have MongoDB installed.

### Frontend
```bash
cd frontend
cp .env.example .env         # points at the backend URL
npm install
npm run dev
```
Visit `http://localhost:5173` for the public site,
`http://localhost:5173/admin/login` for the dashboard.

## Where things stand vs. the roadmap

| Phase | Status |
|---|---|
| 1 — Foundation | ✅ Public site skeleton, auth, hero editor |
| 2 — Admin dashboard core (product CRUD) | ✅ Product CRUD (physical/digital/course), public store page |
| 3 — Course system (lessons, HLS video streaming) | Not started |
| 4 — Store & checkout (KelvIQ integration) | Not started |
| 5 — Polish (digital delivery, emails) | Not started |

## Deploying (Vercel + Railway + MongoDB Atlas)

**0. Push this project to GitHub** (Vercel/Railway both deploy from a repo):
```bash
cd crochet-para-el-alma
git init
git add .
git commit -m "Phase 1: public site + auth foundation"
git branch -M main
git remote add origin https://github.com/<your-username>/crochet-para-el-alma.git
git push -u origin main
```

**1. MongoDB Atlas** — see the setup steps already covered; have your
`mongodb+srv://...` connection string ready.

**2. Backend on Railway**
1. https://railway.app → New Project → Deploy from GitHub repo → select this repo.
2. In the service settings, set **Root Directory** to `backend`.
   (`railway.json` in that folder already tells Railway how to start it —
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.)
3. Add environment variables (Variables tab) — copy every key from
   `backend/.env.example`, with real values: `MONGO_URI`, `MONGO_DB_NAME`,
   `JWT_SECRET` (generate a long random string), `CORS_ORIGINS` (your future
   frontend domain, e.g. `https://yourdomain.com`), `FIRST_ADMIN_EMAIL`,
   `FIRST_ADMIN_PASSWORD`.
4. Deploy. Once live, go to Settings → Networking → **Generate Domain** (gives
   you a `*.up.railway.app` URL to confirm it works), then **Add Custom
   Domain** → enter `api.yourdomain.com` → Railway gives you a CNAME record.

**3. Frontend on Vercel**
1. https://vercel.com → Add New Project → import the same GitHub repo.
2. Set **Root Directory** to `frontend` (Vercel auto-detects Vite; `vercel.json`
   handles the SPA routing rewrite).
3. Add environment variable `VITE_API_URL` = `https://api.yourdomain.com`.
4. Deploy. Then Settings → Domains → add `yourdomain.com` (and `www` if
   wanted) → Vercel gives you the A/CNAME records to add.

**4. DNS (at your domain registrar)**
- Add the CNAME record Railway gave you for `api.yourdomain.com`.
- Add the A/CNAME record(s) Vercel gave you for the root domain (and `www`).
- DNS propagation can take a few minutes to a few hours.

**5. Close the loop**
- Once `api.yourdomain.com` resolves, double check `CORS_ORIGINS` on Railway
  matches your real frontend domain exactly (including `https://`), and
  redeploy if you changed it after the first deploy.
- Log in at `https://yourdomain.com/admin/login` with `FIRST_ADMIN_EMAIL` /
  `FIRST_ADMIN_PASSWORD` and change the password (Phase 2 will add a proper
  "change password" screen — for now this account is exactly what you set in
  Railway's env vars).

## Notes for next phase
- Product model, course/lesson model, and KelvIQ integration are already
  specced in the project spec doc — Phase 2 picks up directly from there.
- Real photos + brand fonts (if you have exact font files rather than the
  Playfair Display / Poppins approximation) can be swapped in without
  touching layout code.
