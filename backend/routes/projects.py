"""Deployments / Projects routes."""
import re
import random
from fastapi import APIRouter, Depends, HTTPException
from ..auth import require_user
from ..db import db, utcnow
from ..models import ProjectIn, gen_id

router = APIRouter(prefix="/api/projects", tags=["projects"])


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9-]+", "-", name.lower()).strip("-")
    return (s or "project") + "-" + gen_id("")[:6]


@router.get("")
async def list_projects(user=Depends(require_user)):
    cursor = db.projects.find({"user_id": user["user_id"]}, {"_id": 0}).sort("last_deployed_at", -1)
    return await cursor.to_list(500)


@router.post("")
async def create_project(payload: ProjectIn, user=Depends(require_user)):
    slug = slugify(payload.name)
    now = utcnow().isoformat()
    doc = {
        "project_id": gen_id("prj"),
        "user_id": user["user_id"],
        "name": payload.name,
        "slug": slug,
        "live_url": f"https://{slug}.launchpilot.app",
        "status": "ready",
        "environment": "production",
        "framework": "static",
        "description": payload.description,
        "source_url": payload.source_url,
        "created_at": now,
        "last_deployed_at": now,
        "deployments_count": 1,
        "build_seconds": random.randint(8, 42),
    }
    await db.projects.insert_one(doc.copy())
    await db.deployments.insert_one({
        "deployment_id": gen_id("dep"),
        "project_id": doc["project_id"],
        "user_id": user["user_id"],
        "status": "ready",
        "environment": "production",
        "commit_message": "initial deployment",
        "duration_seconds": doc["build_seconds"],
        "created_at": now,
    })
    return doc


@router.get("/{project_id}")
async def get_project(project_id: str, user=Depends(require_user)):
    p = await db.projects.find_one({"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    deployments = await db.deployments.find(
        {"project_id": project_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"project": p, "deployments": deployments}


@router.post("/{project_id}/deploy")
async def deploy(project_id: str, user=Depends(require_user)):
    p = await db.projects.find_one({"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    now = utcnow().isoformat()
    duration = random.randint(8, 42)
    await db.deployments.insert_one({
        "deployment_id": gen_id("dep"),
        "project_id": project_id,
        "user_id": user["user_id"],
        "status": "ready",
        "environment": "production",
        "commit_message": "redeploy",
        "duration_seconds": duration,
        "created_at": now,
    })
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {"last_deployed_at": now, "status": "ready"},
         "$inc": {"deployments_count": 1}},
    )
    return {"ok": True}


@router.delete("/{project_id}")
async def delete_project(project_id: str, user=Depends(require_user)):
    res = await db.projects.delete_one({"project_id": project_id, "user_id": user["user_id"]})
    await db.deployments.delete_many({"project_id": project_id, "user_id": user["user_id"]})
    return {"deleted": res.deleted_count}
