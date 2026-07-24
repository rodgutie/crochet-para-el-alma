import asyncio
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

from app.database import course_lessons_collection, entitlements_collection, products_collection, users_collection
from app.deps import require_admin
from app.r2 import fetch_and_rewrite_manifest, transcode_and_upload
from app.schemas import CourseLessonIn, CourseLessonOut, ReorderIn
from app.security import decode_access_token

router = APIRouter(prefix="/api/courses", tags=["lessons"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Not found")


def _doc_to_out(doc: dict) -> CourseLessonOut:
    return CourseLessonOut(
        id=str(doc["_id"]),
        product_id=str(doc["product_id"]),
        order=doc.get("order", 0),
        title=doc.get("title", ""),
        video_key=doc.get("video_key"),
        attachments=doc.get("attachments", []),
        duration_seconds=doc.get("duration_seconds"),
        created_at=doc["created_at"],
        video_status=doc.get("video_status", "none"),
    )


async def _require_course(product_id: str) -> dict:
    doc = await products_collection.find_one({"_id": _oid(product_id), "type": "course"})
    if not doc:
        raise HTTPException(status_code=404, detail="Course product not found")
    return doc


# ---------------------------------------------------------------------------
# Background task: ffmpeg transcode → R2 upload
# ---------------------------------------------------------------------------

async def _transcode_and_upload_task(input_path: str, product_id: str, lesson_id: str) -> None:
    """
    Async wrapper around the sync ffmpeg+boto3 work. Runs the heavy lifting
    in a thread so it doesn't block the event loop. Updates video_status in
    MongoDB on success or failure.
    """
    key_prefix = f"courses/{product_id}/{lesson_id}/"
    lid = ObjectId(lesson_id)

    await course_lessons_collection.update_one(
        {"_id": lid},
        {"$set": {"video_status": "processing"}},
    )
    try:
        await asyncio.to_thread(transcode_and_upload, input_path, key_prefix)
        await course_lessons_collection.update_one(
            {"_id": lid},
            {"$set": {"video_status": "ready", "video_key": key_prefix}},
        )
        print(f"[transcode] lesson {lesson_id} ready at {key_prefix}")
    except Exception as exc:
        print(f"[transcode] lesson {lesson_id} FAILED: {exc}")
        await course_lessons_collection.update_one(
            {"_id": lid},
            {"$set": {"video_status": "error"}},
        )


# ---------------------------------------------------------------------------
# Lesson CRUD
# ---------------------------------------------------------------------------

@router.get("/{product_id}/lessons", response_model=List[CourseLessonOut])
async def list_lessons_public(product_id: str):
    """Public: ordered lesson list with video_key stripped."""
    await _require_course(product_id)
    cursor = course_lessons_collection.find({"product_id": _oid(product_id)}).sort("order", 1)
    lessons = [_doc_to_out(doc) async for doc in cursor]
    for lesson in lessons:
        lesson.video_key = None
    return lessons


@router.get(
    "/{product_id}/lessons/admin",
    response_model=List[CourseLessonOut],
    dependencies=[Depends(require_admin)],
)
async def list_lessons_admin(product_id: str):
    """Admin: ordered lesson list including video_key and video_status."""
    await _require_course(product_id)
    cursor = course_lessons_collection.find({"product_id": _oid(product_id)}).sort("order", 1)
    return [_doc_to_out(doc) async for doc in cursor]


@router.post(
    "/{product_id}/lessons",
    response_model=CourseLessonOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_lesson(product_id: str, payload: CourseLessonIn):
    await _require_course(product_id)
    doc = payload.model_dump()
    doc["product_id"] = _oid(product_id)
    doc["video_status"] = "none"
    doc["created_at"] = datetime.now(timezone.utc)
    result = await course_lessons_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


@router.put(
    "/{product_id}/lessons/{lesson_id}",
    response_model=CourseLessonOut,
    dependencies=[Depends(require_admin)],
)
async def update_lesson(product_id: str, lesson_id: str, payload: CourseLessonIn):
    update_data = payload.model_dump()
    # video_key and video_status are managed exclusively by the upload pipeline
    update_data.pop("video_key", None)
    update_data["product_id"] = _oid(product_id)

    result = await course_lessons_collection.find_one_and_update(
        {"_id": _oid(lesson_id), "product_id": _oid(product_id)},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return _doc_to_out(result)


@router.delete(
    "/{product_id}/lessons/{lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_lesson(product_id: str, lesson_id: str):
    result = await course_lessons_collection.delete_one(
        {"_id": _oid(lesson_id), "product_id": _oid(product_id)}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")


@router.post(
    "/{product_id}/lessons/reorder",
    dependencies=[Depends(require_admin)],
)
async def reorder_lessons(product_id: str, payload: ReorderIn):
    pid = _oid(product_id)
    for i, lesson_id in enumerate(payload.ordered_ids):
        await course_lessons_collection.update_one(
            {"_id": _oid(lesson_id), "product_id": pid},
            {"$set": {"order": i}},
        )
    return {"ok": True}


# ---------------------------------------------------------------------------
# Video upload (admin)
# ---------------------------------------------------------------------------

@router.post(
    "/{product_id}/lessons/{lesson_id}/upload-video",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(require_admin)],
)
async def upload_lesson_video(
    product_id: str,
    lesson_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Accepts a raw video file, saves it to a temp path, and kicks off a
    background task that transcodes it to HLS and uploads to R2.
    Returns 202 immediately; poll video_status on the lesson to track progress.
    """
    lesson = await course_lessons_collection.find_one(
        {"_id": _oid(lesson_id), "product_id": _oid(product_id)}
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    suffix = Path(file.filename or "video.mp4").suffix or ".mp4"
    fd, input_path = tempfile.mkstemp(suffix=suffix, prefix="upload_")
    try:
        with os.fdopen(fd, "wb") as tmp:
            while chunk := await file.read(1024 * 1024):  # 1 MB chunks
                tmp.write(chunk)
    except Exception:
        os.unlink(input_path)
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")

    background_tasks.add_task(_transcode_and_upload_task, input_path, product_id, lesson_id)
    return {"detail": "Upload received — transcoding in progress", "lesson_id": lesson_id}


# ---------------------------------------------------------------------------
# HLS stream (customer — entitlement gated)
# ---------------------------------------------------------------------------

@router.get("/{product_id}/lessons/{lesson_id}/stream")
async def stream_lesson(
    product_id: str,
    lesson_id: str,
    token: str = Query(..., description="JWT access token (passed as query param for hls.js compatibility)"),
):
    """
    Verifies the caller's entitlement, then returns the HLS manifest with
    every .ts chunk line replaced by a 10-minute presigned R2 URL.
    hls.js / Safari native HLS fetches chunks directly from R2 — zero backend
    bandwidth for the actual video data.
    """
    # --- Auth ---
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    try:
        user = await users_collection.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
    if not user:
        raise HTTPException(status_code=401, detail="Token inválido")

    # --- Entitlement ---
    has_access = await entitlements_collection.find_one({
        "user_id": user["_id"],
        "product_id": _oid(product_id),
    })
    if not has_access:
        raise HTTPException(status_code=403, detail="No tienes acceso a este curso")

    # --- Lesson ---
    lesson = await course_lessons_collection.find_one(
        {"_id": _oid(lesson_id), "product_id": _oid(product_id)}
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="Lección no encontrada")

    video_status = lesson.get("video_status", "none")
    if video_status == "processing":
        raise HTTPException(status_code=503, detail="El video todavía se está procesando")
    if video_status != "ready":
        raise HTTPException(status_code=404, detail="Esta lección no tiene video todavía")

    key_prefix = lesson["video_key"]  # e.g. "courses/{pid}/{lid}/"

    # --- Rewrite manifest (sync boto3 → thread) ---
    try:
        manifest_text = await asyncio.to_thread(fetch_and_rewrite_manifest, key_prefix)
    except Exception as exc:
        print(f"[stream] R2 error for {key_prefix}: {exc}")
        raise HTTPException(status_code=502, detail="No se pudo cargar el video desde el almacenamiento")

    return Response(content=manifest_text, media_type="application/vnd.apple.mpegurl")
