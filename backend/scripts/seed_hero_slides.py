"""One-time, idempotent seed for the editorial home hero (3 slides).

Upserts by image_url, so running it twice never duplicates slides. It also
sets `order` on these three and leaves any OTHER existing slides alone
(use --replace to deactivate the rest, e.g. the old placeholder slide).

Run from the backend/ folder against whichever DB your env points to:

    # PowerShell
    $env:MONGO_URI = "mongodb+srv://USER:PASS@CLUSTER.mongodb.net/"
    $env:MONGO_DB_NAME = "crochet_para_el_alma"      # only if not the default
    python -m scripts.seed_hero_slides                # add --replace to hide old slides

    # bash
    MONGO_URI="mongodb+srv://..." python -m scripts.seed_hero_slides

(Alternatively put MONGO_URI in backend/.env; app.config reads it.)
"""
import asyncio
import sys

from app.database import hero_slides_collection

CAMPAIGN_URL = "https://klouser.app/group/7386/p/46265"

SLIDES = [
    {
        "order": 0,
        "image_url": "/images/diseno.jpg",
        "eyebrow": "COLECCIÓN BOLSOS FLOR",
        "headline": "Un bolso tejido que cuenta tu historia",
        "subtext": "Flores de crochet en rosa y mostaza, hechas a mano para acompañar tu look.",
        "cta_text": "Ver la colección",
        "cta_link": "/tienda",
        "image_side": "right",
        "accent": "none",
        "focal_x": "left",
    },
    {
        "order": 1,
        "image_url": "/images/navidad-monica-gnomos.jpg",
        "eyebrow": "NAVIDAD 2026",
        "headline": "Gnomos tejidos para una Navidad con alma",
        "subtext": "Pequeños, suaves y hechos con cariño.",
        "cta_text": "Descubre la Navidad",
        "cta_link": "/tienda",
        "image_side": "left",
        "accent": "navidad",
    },
    {
        "order": 2,
        "image_url": "/images/bolso-flor-hero.jpg",
        "eyebrow": "MEMBRESÍA",
        "headline": "Teje tu propio bolso flor, paso a paso",
        "subtext": "Únete y aprende a tu ritmo, con una comunidad que teje contigo.",
        "cta_text": "Quiero unirme",
        "cta_link": CAMPAIGN_URL,
        "image_side": "right",
        "accent": "none",
    },
]


async def main(replace: bool) -> None:
    for slide in SLIDES:
        doc = {"focal_point": "center", "focal_x": "center", **slide, "active": True}
        res = await hero_slides_collection.update_one(
            {"image_url": slide["image_url"]}, {"$set": doc}, upsert=True
        )
        print(("created" if res.upserted_id else "updated"), slide["image_url"])

    if replace:
        keep = [s["image_url"] for s in SLIDES]
        res = await hero_slides_collection.update_many(
            {"image_url": {"$nin": keep}}, {"$set": {"active": False}}
        )
        print(f"deactivated {res.modified_count} other slide(s)")


if __name__ == "__main__":
    asyncio.run(main("--replace" in sys.argv))
