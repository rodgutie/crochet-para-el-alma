import asyncio
import mimetypes
import os
import tempfile
import uuid
from pathlib import Path

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse

from app.config import settings
from app.deps import require_admin
from app.r2 import get_r2_client

router = APIRouter(prefix="/api/media", tags=["media"])


@router.post("/upload", dependencies=[Depends(require_admin)])
async def upload_media(
    file: UploadFile = File(...),
    folder: str = Query("general", description="Subfolder in R2: hero, products, digital, attachments"),
):
    """
    Uploads any file to R2 under media/{folder}/{uuid}{ext} and returns the
    URL path so the frontend can construct the full URL as:
        ${VITE_API_URL}/api/media/{path}
    """
    ext = Path(file.filename or "file").suffix.lower() or ".bin"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    r2_key = f"media/{folder}/{unique_name}"
    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"

    # Write to temp file so boto3 can upload_file (handles large files without
    # reading everything into RAM at once).
    fd, tmp_path = tempfile.mkstemp(suffix=ext, prefix="media_")
    try:
        with os.fdopen(fd, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1 MB chunks
                f.write(chunk)

        def do_upload():
            r2 = get_r2_client()
            r2.upload_file(
                tmp_path,
                settings.r2_bucket_name,
                r2_key,
                ExtraArgs={"ContentType": content_type},
            )

        await asyncio.to_thread(do_upload)
    finally:
        try:
            os.unlink(tmp_path)
        except FileNotFoundError:
            pass

    # Return only the path under /api/media/ — the frontend appends VITE_API_URL.
    return {"path": f"{folder}/{unique_name}"}


@router.get("/{path:path}")
async def serve_media(path: str):
    """
    Streams a file from R2. Public — no auth required, so product images and
    PDFs load in <img> and <a> tags without authentication.
    """
    r2_key = f"media/{path}"
    content_type = mimetypes.guess_type(path)[0] or "application/octet-stream"

    def fetch():
        r2 = get_r2_client()
        return r2.get_object(Bucket=settings.r2_bucket_name, Key=r2_key)

    try:
        obj = await asyncio.to_thread(fetch)
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        if code in ("NoSuchKey", "404"):
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
        raise HTTPException(status_code=502, detail="Error al acceder al almacenamiento")

    def stream_body():
        yield from obj["Body"].iter_chunks(65536)  # 64 KB chunks

    return StreamingResponse(
        stream_body(),
        media_type=content_type,
        headers={
            # Files are content-addressed (UUID names), safe to cache forever.
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    )
