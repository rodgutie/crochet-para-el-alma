from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from bson.errors import InvalidId

from app.database import entitlements_collection, users_collection, products_collection
from app.schemas import EntitlementGrantIn, EntitlementOut, MyEntitlementOut
from app.deps import require_admin, get_current_user

router = APIRouter(prefix="/api/admin/entitlements", tags=["entitlements"])
me_router = APIRouter(prefix="/api/me", tags=["me"])


def _oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Not found")


@router.get("", response_model=List[EntitlementOut], dependencies=[Depends(require_admin)])
async def list_entitlements():
    cursor = entitlements_collection.find({}).sort("granted_at", -1)
    results = []
    async for doc in cursor:
        user = await users_collection.find_one({"_id": doc["user_id"]})
        product = await products_collection.find_one({"_id": doc["product_id"]})
        results.append(EntitlementOut(
            id=str(doc["_id"]),
            user_id=str(doc["user_id"]),
            product_id=str(doc["product_id"]),
            order_id=str(doc["order_id"]) if doc.get("order_id") else None,
            granted_at=doc["granted_at"],
            user_email=user.get("email") if user else None,
            user_name=user.get("name") if user else None,
            product_name=product.get("name") if product else None,
        ))
    return results


@router.post(
    "",
    response_model=EntitlementOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def grant_entitlement(payload: EntitlementGrantIn):
    user = await users_collection.find_one({"_id": _oid(payload.user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    product = await products_collection.find_one({"_id": _oid(payload.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = await entitlements_collection.find_one({
        "user_id": _oid(payload.user_id),
        "product_id": _oid(payload.product_id),
    })
    if existing:
        raise HTTPException(status_code=409, detail="El usuario ya tiene acceso a este producto")

    doc = {
        "user_id": _oid(payload.user_id),
        "product_id": _oid(payload.product_id),
        "order_id": None,
        "granted_at": datetime.now(timezone.utc),
    }
    result = await entitlements_collection.insert_one(doc)
    doc["_id"] = result.inserted_id

    return EntitlementOut(
        id=str(doc["_id"]),
        user_id=str(doc["user_id"]),
        product_id=str(doc["product_id"]),
        order_id=None,
        granted_at=doc["granted_at"],
        user_email=user.get("email"),
        user_name=user.get("name"),
        product_name=product.get("name"),
    )


@router.delete(
    "/{entitlement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def revoke_entitlement(entitlement_id: str):
    result = await entitlements_collection.delete_one({"_id": _oid(entitlement_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entitlement not found")


# ---------------------------------------------------------------------------
# Customer: own entitlements
# ---------------------------------------------------------------------------

@me_router.get("/entitlements", response_model=List[MyEntitlementOut])
async def my_entitlements(current_user: dict = Depends(get_current_user)):
    """Returns the logged-in customer's entitlements with product details."""
    cursor = entitlements_collection.find({"user_id": current_user["_id"]})
    results = []
    async for doc in cursor:
        product = await products_collection.find_one({"_id": doc["product_id"]})
        results.append(MyEntitlementOut(
            id=str(doc["_id"]),
            product_id=str(doc["product_id"]),
            order_id=str(doc["order_id"]) if doc.get("order_id") else None,
            granted_at=doc["granted_at"],
            product_name=product.get("name", "") if product else "",
            product_type=product.get("type", "") if product else "",
            product_images=product.get("images", []) if product else [],
            product_description=product.get("description", "") if product else "",
        ))
    return results
