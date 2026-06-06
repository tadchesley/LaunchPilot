"""Database, MongoDB connection & shared helpers."""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

mongo_url = os.environ['MONGO_URL']
_client = AsyncIOMotorClient(mongo_url)
db = _client[os.environ['DB_NAME']]


def utcnow():
    return datetime.now(timezone.utc)


def iso(dt: datetime | None):
    return dt.isoformat() if dt else None


def from_iso(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return None


def strip_id(doc):
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc
