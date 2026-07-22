from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.mongo_db_name]

# Collections used in Phase 1.
# More are added in later phases (products, orders, course_lessons,
# digital_assets, entitlements) — see project spec doc.
users_collection = db["users"]
hero_slides_collection = db["hero_slides"]
