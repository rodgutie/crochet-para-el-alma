# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Crochet para el Alma** — a crochet brand site with a public storefront, customer auth, and an admin dashboard. Built as a React SPA (Vite) + FastAPI backend backed by MongoDB Atlas.

**Deployment targets:** Frontend → Vercel, Backend → Railway, Database → MongoDB Atlas.

## Running locally

### Backend
```bash
cd backend
cp .env.example .env   # set MONGO_URI, JWT_SECRET, FIRST_ADMIN_PASSWORD
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API docs at `http://localhost:8000/docs`. On first startup, `bootstrap()` in `main.py` seeds an admin user and a placeholder hero slide if the DB is empty.

### Frontend
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:8000
npm install
npm run dev
```
Public site at `http://localhost:5173`, admin at `http://localhost:5173/admin/login`.

### Frontend build / preview
```bash
npm run build
npm run preview
```

## Architecture

### Backend (`backend/app/`)
- `main.py` — FastAPI app, CORS middleware, router registration, startup bootstrap
- `config.py` — `pydantic-settings` config; all env vars loaded here as `settings`
- `database.py` — Motor async MongoDB client; exports named collections
- `schemas.py` — all Pydantic request/response models (users, hero slides, products)
- `security.py` — password hashing (bcrypt via passlib) and JWT encode/decode
- `deps.py` — FastAPI dependency injection: `get_current_user`, `require_admin`
- `routers/auth.py` — `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `routers/hero.py` — `/api/hero` CRUD (public GET, admin POST/PUT/DELETE)
- `routers/products.py` — `/api/products` CRUD (public GET, admin POST/PUT/DELETE)

MongoDB documents use `_id: ObjectId`; routers serialize them to `id: str`. There is no ORM — raw Motor async queries throughout.

### Frontend (`frontend/src/`)
- `main.jsx` → `App.jsx` — top-level routing via React Router v6
- `context/AuthContext.jsx` — JWT stored in `localStorage` as `cpa_token`; exposes `user`, `login()`, `logout()` via context
- `api/client.js` — single `apiRequest()` fetch wrapper; named `api` object maps every endpoint
- `components/ProtectedRoute.jsx` — `RequireCustomer` and `RequireAdmin` guards
- `pages/` — public pages (Home, Tienda, Clases, Blog, Contacto, Membresia, Login, Register, MiCuenta)
- `pages/admin/` — `AdminLogin`, `AdminLayout` (outlet shell), `AdminHero`, `AdminProducts`

The public layout wraps pages in `<Navbar> + <Footer>`; admin pages use `AdminLayout` with no public nav.

## Key design conventions

- **Auth roles:** two roles only — `"customer"` and `"admin"`. JWT `sub` is the MongoDB `_id` string.
- **Admin token lifetime** is longer (`admin_token_expire_minutes = 120`) than customer tokens (60 min).
- **CORS origins** are comma-separated in the `CORS_ORIGINS` env var; `config.py` splits them.
- **Product types:** `"physical"` (has `stock`), `"digital"` (has `digital_file_url`), `"course"` (lesson management deferred to Phase 3).
- **Checkout** is intentionally disabled — the "Comprar" button shows a tooltip explaining it activates in Phase 4 (KelvIQ integration).

## Roadmap phases

| Phase | Status |
|---|---|
| 1 — Foundation (public site, auth, hero editor) | ✅ Done |
| 2 — Product CRUD + public store | ✅ Done |
| 3 — Course system (lessons, HLS video streaming) | Not started |
| 4 — Store & checkout (KelvIQ integration) | Not started |
| 5 — Polish (digital delivery, emails) | Not started |

## Environment variables

### Backend (`.env`)
| Key | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `MONGO_DB_NAME` | Database name (default: `crochet_para_el_alma`) |
| `JWT_SECRET` | Long random string for signing JWTs |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `FIRST_ADMIN_EMAIL` | Seeded on first startup |
| `FIRST_ADMIN_PASSWORD` | Seeded on first startup — change immediately |

### Frontend (`.env`)
| Key | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `https://api.yourdomain.com`) |
