"""Website monitoring — periodic uptime checks + in-app notifications."""
import asyncio
import logging
import os
from datetime import datetime, timezone, timedelta
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import APIRouter, Depends

from ..auth import require_user
from ..db import db
from ..models import gen_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["monitoring"])

scheduler: AsyncIOScheduler | None = None


async def _check_one(project: dict) -> dict:
    url = project.get("live_url") or ""
    started = datetime.now(timezone.utc)
    full_url = url
    if url.startswith("/"):
        # internal site, rebuild absolute via APP_URL
        app_url = os.environ.get("APP_URL") or ""
        full_url = app_url.rstrip("/") + url if app_url else None
    status = "unknown"
    code = None
    rt_ms = None
    if full_url and full_url.startswith(("http://", "https://")):
        try:
            t0 = datetime.now(timezone.utc)
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as ac:
                r = await ac.get(full_url)
                code = r.status_code
                status = "up" if r.status_code < 400 else "down"
            rt_ms = int((datetime.now(timezone.utc) - t0).total_seconds() * 1000)
        except Exception as ex:
            status = "down"
            code = 0
            logger.info(f"check failed {full_url}: {ex}")
    return {
        "project_id": project["project_id"],
        "user_id": project["user_id"],
        "status": status,
        "code": code,
        "response_ms": rt_ms,
        "checked_at": started.isoformat(),
    }


async def _run_monitoring_cycle():
    cursor = db.projects.find({}, {"_id": 0})
    projects = await cursor.to_list(500)
    for p in projects:
        try:
            check = await _check_one(p)
            await db.uptime_checks.insert_one(check.copy())
            last_status = p.get("last_uptime_status")
            await db.projects.update_one(
                {"project_id": p["project_id"]},
                {"$set": {
                    "last_uptime_status": check["status"],
                    "last_uptime_code": check["code"],
                    "last_uptime_response_ms": check["response_ms"],
                    "last_uptime_checked_at": check["checked_at"],
                }}
            )
            # Generate notification when status transitions to "down" (and was previously "up")
            if check["status"] == "down" and last_status == "up":
                await db.notifications.insert_one({
                    "notification_id": gen_id("ntf"),
                    "user_id": p["user_id"],
                    "type": "uptime_down",
                    "severity": "high",
                    "title": f"{p['name']} is down",
                    "body": f"We could not reach {p.get('live_url')} (code {check['code']}).",
                    "project_id": p["project_id"],
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
            elif check["status"] == "up" and last_status == "down":
                await db.notifications.insert_one({
                    "notification_id": gen_id("ntf"),
                    "user_id": p["user_id"],
                    "type": "uptime_up",
                    "severity": "low",
                    "title": f"{p['name']} is back online",
                    "body": f"{p.get('live_url')} is responding again.",
                    "project_id": p["project_id"],
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
        except Exception as ex:
            logger.warning(f"monitor cycle error: {ex}")


def start_scheduler():
    global scheduler
    if scheduler:
        return scheduler
    scheduler = AsyncIOScheduler(timezone="UTC")
    # Check every 5 minutes
    scheduler.add_job(_run_monitoring_cycle, "interval", minutes=5, id="uptime_monitor", coalesce=True, max_instances=1)
    scheduler.start()
    logger.info("Monitoring scheduler started (5 min interval).")
    return scheduler


@router.get("/monitoring/{project_id}")
async def project_uptime(project_id: str, user=Depends(require_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0})
    if not project:
        return {"checks": [], "summary": {}}
    checks = await db.uptime_checks.find(
        {"project_id": project_id}, {"_id": 0}
    ).sort("checked_at", -1).limit(72).to_list(72)
    ups = sum(1 for c in checks if c["status"] == "up")
    total = len(checks) or 1
    return {
        "checks": list(reversed(checks)),
        "summary": {
            "uptime_pct": round(ups * 100 / total, 2),
            "last_status": project.get("last_uptime_status") or "unknown",
            "last_response_ms": project.get("last_uptime_response_ms"),
        },
    }


@router.post("/monitoring/{project_id}/check")
async def force_check(project_id: str, user=Depends(require_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0})
    if not project:
        return {"ok": False}
    check = await _check_one(project)
    await db.uptime_checks.insert_one(check.copy())
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {
            "last_uptime_status": check["status"],
            "last_uptime_code": check["code"],
            "last_uptime_response_ms": check["response_ms"],
            "last_uptime_checked_at": check["checked_at"],
        }}
    )
    return check
