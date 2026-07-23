from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import users_collection, hero_slides_collection
from app.security import hash_password
from app.routers import auth, hero, products

app = FastAPI(title="Crochet para el Alma API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(hero.router)
app.include_router(products.router)


@app.on_event("startup")
async def bootstrap():
    """Creates indexes and a first admin user/hero slides if the DB is empty.
    Safe to run every time the app starts."""

    await users_collection.create_index("email", unique=True)

    existing_admin = await users_collection.find_one({"role": "admin"})
    if not existing_admin:
        await users_collection.insert_one({
            "name": "Admin",
            "email": settings.first_admin_email.lower(),
            "password_hash": hash_password(settings.first_admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
        })
        print(f"[bootstrap] Created first admin: {settings.first_admin_email}")

    slide_count = await hero_slides_collection.count_documents({})
    if slide_count == 0:
        placeholder_slides = [
            {
                "order": 0,
                "image_url": "/placeholder-hero-1.jpg",
                "headline": "Aprende crochet, crea con intenci\u00f3n",
                "subtext": "y encuentra un espacio para ti.",
                "cta_text": "\u00danete a las clases gratuitas",
                "cta_link": "/clases",
                "active": True,
            },
        ]
        await hero_slides_collection.insert_many(placeholder_slides)
        print("[bootstrap] Inserted placeholder hero slide")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
