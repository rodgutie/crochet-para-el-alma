import asyncio
import mimetypes
import os
import tempfile
import uuid
from pathlib import Path

import logging

from botocore.exceptions import ClientError, ConnectTimeoutError, EndpointConnectionError, ReadTimeoutError
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse

from app.config import settings
from app.deps import require_admin
from app.r2 import get_r2_client

logger = logging.getLogger(__name__)

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

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def _r2_error_message(exc: Exception) -> str:
    """Plain-Spanish explanation of why an R2 call failed (shown in the admin)."""
    if isinstance(exc, ClientError):
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("NoSuchBucket",):
            return "El bucket de imágenes no existe en Cloudflare R2. Revisa R2_IMAGES_BUCKET_NAME en Railway."
        if code in ("AccessDenied", "InvalidAccessKeyId", "SignatureDoesNotMatch", "Unauthorized", "403"):
            return (
                "Cloudflare R2 rechazó las credenciales o no tienen permiso de escritura en el bucket de "
                "imágenes. Revisa R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY y que el token tenga permiso "
                "«Object Read & Write» sobre ese bucket."
            )
        return f"Cloudflare R2 devolvió un error ({code or 'desconocido'}) al guardar la imagen."
    if isinstance(exc, (EndpointConnectionError, ConnectTimeoutError, ReadTimeoutError)):
        return "No se pudo conectar con Cloudflare R2. Revisa R2_ENDPOINT en Railway."
    return "Ocurrió un error inesperado al subir la imagen. Inténtalo de nuevo."


@images_router.post("/upload", dependencies=[Depends(require_admin)])
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Query("products", pattern="^[a-z0-9_-]{1,32}$", description="Subfolder: hero | products"),
):
    """
    Uploads an image to the PUBLIC R2 images bucket (separate from the private
    video/PDF bucket) and returns its public URL: {"url": "..."}.

    Every failure is raised as an HTTPException so the response is JSON that
    passes through the CORS middleware — an uncaught exception would produce a
    CORS-less 500 that browsers report only as "Failed to fetch".
    """
    if not (settings.r2_images_bucket_name and settings.r2_public_images_url and settings.r2_endpoint
            and settings.r2_access_key_id and settings.r2_secret_access_key):
        raise HTTPException(
            status_code=503,
            detail=(
                "La subida de imágenes todavía no está configurada en el servidor. Faltan variables de R2 en "
                "Railway (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_IMAGES_BUCKET_NAME, "
                "R2_PUBLIC_IMAGES_URL). Mientras tanto puedes pegar la URL de la imagen a mano."
            ),
        )

    ext = Path(file.filename or "").suffix.lower()
    if not (file.content_type or "").startswith("image/") or ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPG, PNG, WEBP, GIF o AVIF.")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    r2_key = f"images/{folder}/{unique_name}"
    content_type = file.content_type or "image/jpeg"

    fd, tmp_path = tempfile.mkstemp(suffix=ext, prefix="img_")
    try:
        size = 0
        with os.fdopen(fd, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_IMAGE_BYTES:
                    raise HTTPException(status_code=413, detail="La imagen pesa más de 10 MB. Reduce su tamaño e inténtalo de nuevo.")
                f.write(chunk)

        def do_upload():
            get_r2_client().upload_file(
                tmp_path,
                settings.r2_images_bucket_name,
                r2_key,
                ExtraArgs={"ContentType": content_type, "CacheControl": "public, max-age=31536000, immutable"},
            )

        try:
            await asyncio.to_thread(do_upload)
        except HTTPException:
            raise
        except Exception as exc:  # noqa: BLE001 - turn every R2 failure into a clear JSON error
            logger.exception("R2 image upload failed")
            raise HTTPException(status_code=502, detail=_r2_error_message(exc))
    finally:
        try:
            os.unlink(tmp_path)
        except FileNotFoundError:
            pass

    return {"url": f"{settings.r2_public_images_url.rstrip('/')}/{r2_key}"}


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
