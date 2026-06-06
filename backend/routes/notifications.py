"""In-app notifications."""
from fastapi import APIRouter, Depends
from ..auth import require_user
from ..db import db

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(user=Depends(require_user)):
    docs = await db.notifications.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    unread = await db.notifications.count_documents({"user_id": user["user_id"], "read": False})
    return {"notifications": docs, "unread": unread}


@router.post("/{notification_id}/read")
async def mark_read(notification_id: str, user=Depends(require_user)):
    await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user["user_id"]},
        {"$set": {"read": True}},
    )
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(user=Depends(require_user)):
    await db.notifications.update_many(
        {"user_id": user["user_id"], "read": False},
        {"$set": {"read": True}},
    )
    return {"ok": True}
