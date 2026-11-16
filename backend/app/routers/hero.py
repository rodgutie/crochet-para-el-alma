from typing import List

from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from bson.errors import InvalidId

from app.database import hero_slides_collection
from app.schemas import HeroSlideIn, HeroSlideOut
from app.deps import require_admin

router = APIRouter(prefix="/api/hero", tags=["hero"])


def _doc_to_out(doc: dict) -> HeroSlideOut:
    return HeroSlideOut(
        id=str(doc["_id"]),
        order=doc.get("order", 0),
        image_url=doc.get("image_url", ""),
        headline=doc.get("headline", ""),
        subtext=doc.get("subtext") or "",
        cta_text=doc.get("cta_text") or "",
        cta_link=doc.get("cta_link") or "",
        active=doc.get("active", True),
        focal_point=doc.get("focal_point", "center"),
        focal_x=doc.get("focal_x", "center"),
        eyebrow=doc.get("eyebrow") or "",
        image_side=doc.get("image_side", "auto"),
        accent=doc.get("accent", "none"),
    )


@router.get("", response_model=List[HeroSlideOut])
async def list_public_slides():
    """Public endpoint: active slides only, ordered for the homepage carousel."""
    cursor = hero_slides_collection.find({"active": True}).sort("order", 1)
    return [_doc_to_out(doc) async for doc in cursor]


@router.get("/admin", response_model=List[HeroSlideOut], dependencies=[Depends(require_admin)])
async def list_all_slides():
    """Admin endpoint: all slides (active and inactive), for the dashboard editor."""
    cursor = hero_slides_collection.find({}).sort("order", 1)
    return [_doc_to_out(doc) async for doc in cursor]


@router.post("", response_model=HeroSlideOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_slide(payload: HeroSlideIn):
    result = await hero_slides_collection.insert_one(payload.model_dump())
    doc = await hero_slides_collection.find_one({"_id": result.inserted_id})
    return _doc_to_out(doc)


@router.put("/{slide_id}", response_model=HeroSlideOut, dependencies=[Depends(require_admin)])
async def update_slide(slide_id: str, payload: HeroSlideIn):
    try:
        oid = ObjectId(slide_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Slide not found")

    result = await hero_slides_collection.find_one_and_update(
        {"_id": oid}, {"$set": payload.model_dump()}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Slide not found")
    return _doc_to_out(result)


@router.delete("/{slide_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_slide(slide_id: str):
    try:
        oid = ObjectId(slide_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Slide not found")

    result = await hero_slides_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slide not found")


@router.put("/{slide_id}/reorder/{new_order}", response_model=HeroSlideOut, dependencies=[Depends(require_admin)])
async def reorder_slide(slide_id: str, new_order: int):
    try:
        oid = ObjectId(slide_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Slide not found")

    result = await hero_slides_collection.find_one_and_update(
        {"_id": oid}, {"$set": {"order": new_order}}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Slide not found")
    return _doc_to_out(result)
