"""
Cloudflare R2 helpers (S3-compatible via boto3).

All functions in this module are synchronous — call them with
asyncio.to_thread() from async endpoints so they don't block the event loop.
"""
import os
import shutil
import subprocess
import tempfile

import boto3
from botocore.config import Config

from app.config import settings


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def transcode_and_upload(input_path: str, key_prefix: str) -> None:
    """
    Transcodes *input_path* to HLS via ffmpeg, uploads all resulting files
    to R2 under *key_prefix*, then deletes both the input and temp dir.

    key_prefix should end with '/', e.g. 'courses/{pid}/{lid}/'.
    Raises RuntimeError if ffmpeg exits non-zero.
    """
    tmp_dir = tempfile.mkdtemp(prefix="hls_")
    try:
        manifest_path = os.path.join(tmp_dir, "index.m3u8")
        chunk_pattern = os.path.join(tmp_dir, "chunk_%03d.ts")

        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-c:v", "libx264", "-crf", "23", "-preset", "fast",
                "-c:a", "aac", "-b:a", "128k",
                "-hls_time", "10",
                "-hls_playlist_type", "vod",
                "-hls_segment_filename", chunk_pattern,
                manifest_path,
            ],
            capture_output=True,
            timeout=3600,
        )
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg failed:\n{result.stderr.decode(errors='replace')}")

        r2 = get_r2_client()
        for filename in sorted(os.listdir(tmp_dir)):
            r2.upload_file(
                os.path.join(tmp_dir, filename),
                settings.r2_bucket_name,
                f"{key_prefix}{filename}",
            )
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        try:
            os.unlink(input_path)
        except FileNotFoundError:
            pass


def fetch_and_rewrite_manifest(key_prefix: str) -> str:
    """
    Downloads the HLS manifest from R2, rewrites every .ts chunk line to a
    presigned URL valid for 10 minutes, and returns the modified manifest text.

    key_prefix must end with '/', e.g. 'courses/{pid}/{lid}/'.
    """
    r2 = get_r2_client()
    manifest_key = f"{key_prefix}index.m3u8"

    obj = r2.get_object(Bucket=settings.r2_bucket_name, Key=manifest_key)
    raw = obj["Body"].read().decode("utf-8")

    out_lines = []
    for line in raw.splitlines():
        stripped = line.strip()
        if stripped.endswith(".ts"):
            signed = r2.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.r2_bucket_name,
                    "Key": f"{key_prefix}{stripped}",
                },
                ExpiresIn=600,  # 10 min — enough for continuous playback
            )
            out_lines.append(signed)
        else:
            out_lines.append(line)

    return "\n".join(out_lines)
