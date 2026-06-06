"""Emergent Object Storage helpers."""
import os
import uuid
import logging
import requests

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "launchpilot"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

logger = logging.getLogger(__name__)

_storage_key = None


def init_storage():
    """Call ONCE at startup. Returns a session-scoped, reusable storage_key."""
    global _storage_key
    if _storage_key:
        return _storage_key
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_KEY},
            timeout=30,
        )
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized.")
        return _storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise RuntimeError("Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    if not key:
        raise RuntimeError("Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def make_user_path(user_id: str, ext: str, kind: str = "uploads") -> str:
    return f"{APP_NAME}/{kind}/{user_id}/{uuid.uuid4().hex}.{ext.lstrip('.')}"


MIME_TYPES = {
    "html": "text/html", "htm": "text/html",
    "css": "text/css", "js": "application/javascript",
    "json": "application/json", "svg": "image/svg+xml",
    "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "gif": "image/gif", "webp": "image/webp", "ico": "image/x-icon",
    "woff": "font/woff", "woff2": "font/woff2", "ttf": "font/ttf",
    "txt": "text/plain", "pdf": "application/pdf",
    "csv": "text/csv", "xml": "application/xml",
    "mp4": "video/mp4", "webm": "video/webm",
}


def mime_for(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return MIME_TYPES.get(ext, "application/octet-stream")
