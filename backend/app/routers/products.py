from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from bson.errors import InvalidId

from app.database import products_collection
from app.schemas import ProductIn, ProductOut
from app.deps import require_admin

router = APIRouter(prefix="/api/products", tags=["products"])


def _doc_to_out(doc: dict) -> ProductOut:
    return ProductOut(
        id=str(doc["_id"]),
        type=doc["type"],
        name=doc.get("name", ""),
        description=doc.get("description", ""),
        price=doc.get("price", 0),
        currency=doc.get("currency", "USD"),
        images=doc.get("images", []),
        active=doc.get("active", True),
        stock=doc.get("stock"),
        digital_file_url=doc.get("digital_file_url"),
        created_at=doc["created_at"],
    )


@router.get("", response_model=List[ProductOut])
async def list_public_products():
    """Public endpoint: active products only, for the store page."""
    cursor = products_collection.find({"active": True}).sort("created_at", -1)
    return [_doc_to_out(doc) async for doc in cursor]


@router.get("/admin/all", response_model=List[ProductOut], dependencies=[Depends(require_admin)])
async def list_all_products():
    """Admin endpoint: all products (active and inactive), for the dashboard."""
    cursor = products_collection.find({}).sort("created_at", -1)
    return [_doc_to_out(doc) async for doc in cursor]


@router.get("/{product_id}", response_model=ProductOut)
async def get_public_product(product_id: str):
    try:
        oid = ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Product not found")

    doc = await products_collection.find_one({"_id": oid, "active": True})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return _doc_to_out(doc)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_product(payload: ProductIn):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await products_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


@router.put("/{product_id}", response_model=ProductOut, dependencies=[Depends(require_admin)])
async def update_product(product_id: str, payload: ProductIn):
    try:
        oid = ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await products_collection.find_one_and_update(
        {"_id": oid}, {"$set": payload.model_dump()}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return _doc_to_out(result)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_product(product_id: str):
    try:
        oid = ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await products_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
