# Crochet para el Alma — Rebuild & Platform Spec

## 0. Assumptions on record
These were defaulted (not explicitly confirmed) — flag if wrong:
- Admin dashboard can fully build courses (create course, add lessons, upload video/PDF) — not just edit hero/products.
- Stack stays React + FastAPI + MongoDB (same as the Emergent original).

Confirmed decisions:
- Course access: **buy each course individually** (one-time purchase, no subscription/membership gate).
- Video delivery: **self-hosted, streamed via signed HLS** (chunked, time-limited URLs — not a single downloadable file) to make casual downloading hard.
- Payments: **KelvIQ, via their API** (need their docs: auth method, checkout/session flow, webhook/callback format for confirming payment).
- Course structure: **multi-lesson/module courses** (mini-curriculum, not single video).
- Digital products (non-course): **downloadable files** — PDF patterns, charts, etc. Delivered instantly after purchase.
- Physical products: **no shipping calculation** — checkout just collects a note/contact info for local pickup/delivery arranged manually.

---

## 1. Site map (from original)

**Public site**
- `/` — Home: hero carousel, founder bio ("Hola, soy Mónica"), two feature cards (Tienda / Clases), 3-icon value props, CTA banner, podcast block, footer
- `/tienda` — Store: grid of products (physical, digital, courses)
- `/tienda/:id` — Product detail + buy button
- `/clases` — Courses landing (marketing page for what's on offer)
- `/membresia` — currently unused since no subscription model, can repurpose or drop
- `/blog` — out of scope for this build unless you want it (flag if needed)
- `/contacto` — contact form/info

**New: customer-only area (requires login)**
- `/login`, `/registro` — email + password auth
- `/mi-cuenta` — profile, order history, "my courses" library
- `/mi-cuenta/cursos/:id` — course player: lesson list + video player + downloadable attachments per lesson

**New: admin dashboard** (separate, auth-protected, not visible in public nav)
- `/admin/login`
- `/admin/hero` — edit hero carousel: add/remove/reorder slides, each with image, headline, subtext, CTA text/link
- `/admin/productos` — product list, add/edit/delete (type: physical / digital / course)
- `/admin/productos/nuevo` — form: name, price, description, images, type-specific fields
- `/admin/cursos/:id/lecciones` — for course-type products: manage lessons (title, video upload, order, attached PDFs)
- `/admin/pedidos` — order list (who bought what, payment status from KelvIQ)

---

## 2. Data model (MongoDB collections)

**users**
```
_id, email, password_hash, name, created_at, role: "customer" | "admin"
```

**hero_slides**
```
_id, order, image_url, headline, subtext, cta_text, cta_link, active
```

**products**
```
_id, type: "physical" | "digital" | "course"
name, description, price, currency, images[], active, stock (physical only), created_at
```

**course_lessons** (only for type="course" products)
```
_id, product_id, order, title, video_key (internal ref to stored video, not a public URL), attachments[] (PDF/file URLs), duration_seconds
```

**digital_assets** (for type="digital" products)
```
_id, product_id, file_url, file_name
```

**orders**
```
_id, user_id, items[{product_id, price_at_purchase}], total, currency,
kelviq_payment_id, status: "pending" | "paid" | "failed",
delivery_note (for physical, free-text pickup/delivery info), created_at
```

**entitlements** (what a user has unlocked)
```
_id, user_id, product_id, order_id, granted_at
```
Course/digital access is checked against this table — created automatically when an order's status flips to "paid" via KelvIQ webhook.

---

## 3. Video protection approach (self-hosted, no easy downloads)

1. Admin uploads raw video via dashboard → backend transcodes to **HLS** (multiple `.ts` chunks + `.m3u8` manifest) using ffmpeg.
2. Files stored privately (not publicly reachable).
3. When an entitled user opens a lesson, backend issues a **short-lived signed URL** (expires in minutes) for the manifest; player (e.g. hls.js / video.js) streams chunk by chunk.
4. No single file to right-click-save; link expires quickly if copied elsewhere.
5. This isn't unbreakable DRM (nothing self-hosted truly is) but stops casual downloading, which matches your goal.

---

## 4. Payments — KelvIQ integration points (need their docs to finalize)

Standard flow to plan for regardless of their exact API:
1. Customer checks out → backend creates a KelvIQ payment session/intent with order total.
2. Customer redirected to KelvIQ's hosted checkout (or embedded widget, depending on their API).
3. KelvIQ sends a **webhook/callback** on success/failure → backend verifies signature, marks order `paid`, creates `entitlements`.
4. Customer redirected back to a confirmation page; course/digital product becomes available in "Mi cuenta" instantly; physical product triggers manual fulfillment note to admin.

**What I need from you once available:** KelvIQ API docs — auth (API key/OAuth), endpoint for creating a charge/session, webhook payload format and signature verification method.

---

## 5. Build phases

**Phase 1 — Foundation**
- Recreate public site pages/components matching the original design (hero carousel, bio section, feature cards, footer, nav)
- Set up MongoDB collections, FastAPI backend skeleton, auth (customer + admin, JWT-based)

**Phase 2 — Admin dashboard core**
- Hero editor (CRUD for slides + image upload)
- Product CRUD (physical/digital/course types)
- Order list view

**Phase 3 — Course system**
- Lesson management in admin (add/reorder lessons, upload video → transcode pipeline, attach PDFs)
- Customer course player with signed-URL streaming
- "Mi cuenta" library showing purchased courses/digital files

**Phase 4 — Store & checkout**
- Public store grid + product detail pages pulling from API
- Cart + checkout flow
- KelvIQ integration (pending their docs) + webhook handling + entitlement granting

**Phase 5 — Polish**
- Digital file delivery (instant download link post-purchase, expiring)
- Order confirmation emails
- Admin order/pickup notes visibility

---

## 6. Open items before/while building
- KelvIQ API docs (blocking for Phase 4)
- Do you want `/blog` and `/membresia` kept, repurposed, or removed from nav?
- Branding assets: do you have the original logo/photos/fonts, or should I extract from the live site/screenshots?
- Any existing product/course content (names, prices, descriptions, actual video files) to seed the first version, or do we launch with placeholders you fill in via the dashboard?
