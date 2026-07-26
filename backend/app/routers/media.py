import asyncio
import mimetypes
import os
import tempfile
import uuid
from pathlib import Path

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import StreamingResponse

from app.config import settings
from app.deps import require_admin
from app.r2 import get_r2_client

router = APIRouter(prefix="/api/media", tags=["media"])
images_router = APIRouter(prefix="/api/images", tags=["images"])


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


# ---------------------------------------------------------------------------
# Public images — separate bucket/prefix with direct Cloudflare CDN URLs
# ---------------------------------------------------------------------------

@images_router.post("/upload", dependencies=[Depends(require_admin)])
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    folder: str = Query("products", description="Subfolder: hero | products"),
):
    """
    Uploads an image to the public R2 images bucket and returns its direct
    public URL.  If R2_PUBLIC_IMAGES_URL is not yet configured it falls back
    to serving through the backend proxy so local dev always works.
    """
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")

    ext = Path(file.filename or "image.jpg").suffix.lower() or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    r2_key = f"images/{folder}/{unique_name}"
    content_type = file.content_type or "image/jpeg"

    bucket = settings.r2_images_bucket_name or settings.r2_bucket_name

    fd, tmp_path = tempfile.mkstemp(suffix=ext, prefix="img_")
    try:
        with os.fdopen(fd, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                f.write(chunk)

        def do_upload():
            r2 = get_r2_client()
            r2.upload_file(
                tmp_path,
                bucket,
                r2_key,
                ExtraArgs={"ContentType": content_type},
            )

        await asyncio.to_thread(do_upload)
    finally:
        try:
            os.unlink(tmp_path)
        except FileNotFoundError:
            pass

    if settings.r2_public_images_url:
        # Direct Cloudflare CDN URL — zero backend bandwidth for image delivery
        url = f"{settings.r2_public_images_url.rstrip('/')}/{r2_key}"
    else:
        # Fallback: serve through the backend proxy endpoint below.
        # Works for local dev; set R2_PUBLIC_IMAGES_URL in production.
        proto = request.headers.get("x-forwarded-proto", request.url.scheme)
        host = request.headers.get("x-forwarded-host") or request.headers.get("host", "localhost:8000")
        url = f"{proto}://{host}/api/images/{folder}/{unique_name}"

    return {"url": url}


@images_router.get("/{path:path}")
async def serve_image(path: str):
    """
    Fallback proxy for images when R2_PUBLIC_IMAGES_URL is not configured.
    In production with public access enabled this route is never hit —
    images are served directly from Cloudflare.
    """
    r2_key = f"images/{path}"
    bucket = settings.r2_images_bucket_name or settings.r2_bucket_name
    content_type = mimetypes.guess_type(path)[0] or "image/jpeg"

    def fetch():
        r2 = get_r2_client()
        return r2.get_object(Bucket=bucket, Key=r2_key)

    try:
        obj = await asyncio.to_thread(fetch)
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        if code in ("NoSuchKey", "404"):
            raise HTTPException(status_code=404, detail="Imagen no encontrada")
        raise HTTPException(status_code=502, detail="Error al acceder al almacenamiento")

    def stream_body():
        yield from obj["Body"].iter_chunks(65536)

    return StreamingResponse(
        stream_body(),
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
