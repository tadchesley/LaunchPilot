"""Visual editor — read/write project files in object storage."""
import io
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from ..auth import require_user
from ..db import db, utcnow
from ..models import gen_id
from ..services.storage_service import put_object, get_object, mime_for

router = APIRouter(prefix="/api/projects", tags=["editor"])
logger = logging.getLogger(__name__)


async def _get_project(project_id: str, user_id: str):
    p = await db.projects.find_one({"project_id": project_id, "user_id": user_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Project not found")
    return p


@router.get("/{project_id}/files")
async def list_files(project_id: str, user=Depends(require_user)):
    p = await _get_project(project_id, user["user_id"])
    files = p.get("files") or []
    return [
        {"rel_path": f["rel_path"], "size": f["size"], "content_type": f["content_type"]}
        for f in files
    ]


@router.get("/{project_id}/files/{rel_path:path}/content")
async def read_file(project_id: str, rel_path: str, user=Depends(require_user)):
    """Return raw bytes (best used for HTML/CSS text files)."""
    p = await _get_project(project_id, user["user_id"])
    target = next((f for f in (p.get("files") or []) if f["rel_path"] == rel_path), None)
    if not target:
        raise HTTPException(404, "File not in project")
    try:
        content, ctype = get_object(target["storage_path"])
    except Exception:
        raise HTTPException(502, "Storage read failed")
    return Response(content=content, media_type=ctype)


@router.put("/{project_id}/files/{rel_path:path}")
async def write_file(project_id: str, rel_path: str, body: dict, user=Depends(require_user)):
    """Write text content (HTML/CSS/JS/etc) back to a file. Body: {content: str}."""
    p = await _get_project(project_id, user["user_id"])
    target = next((f for f in (p.get("files") or []) if f["rel_path"] == rel_path), None)
    if not target:
        raise HTTPException(404, "File not in project")
    content = body.get("content")
    if not isinstance(content, str):
        raise HTTPException(400, "content must be a string")
    data = content.encode("utf-8")
    try:
        put_object(target["storage_path"], data, target["content_type"])
    except Exception:
        raise HTTPException(502, "Storage write failed")
    # Update size + bump last_deployed_at
    new_files = [
        {**f, "size": len(data)} if f["rel_path"] == rel_path else f
        for f in (p.get("files") or [])
    ]
    now = utcnow().isoformat()
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {"files": new_files, "last_deployed_at": now}, "$inc": {"deployments_count": 1}},
    )
    await db.deployments.insert_one({
        "deployment_id": gen_id("dep"),
        "project_id": project_id,
        "user_id": user["user_id"],
        "status": "ready",
        "environment": "production",
        "commit_message": f"edit: {rel_path}",
        "duration_seconds": 1,
        "files_count": 1,
        "created_at": now,
    })
    return {"ok": True, "size": len(data)}


@router.post("/{project_id}/files/{rel_path:path}/replace-image")
async def replace_image(
    project_id: str,
    rel_path: str,
    file: UploadFile = File(...),
    user=Depends(require_user),
):
    """Replace an existing image file with the uploaded one (keeps the same rel_path)."""
    p = await _get_project(project_id, user["user_id"])
    target = next((f for f in (p.get("files") or []) if f["rel_path"] == rel_path), None)
    if not target:
        raise HTTPException(404, "File not in project")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(413, "Image must be < 5MB")
    ctype = mime_for(rel_path)
    try:
        put_object(target["storage_path"], data, ctype)
    except Exception:
        raise HTTPException(502, "Storage write failed")
    return {"ok": True, "size": len(data)}


@router.post("/{project_id}/files/upload")
async def add_file(
    project_id: str,
    file: UploadFile = File(...),
    rel_path: str = Form(...),
    user=Depends(require_user),
):
    """Add a new file (e.g. a fresh image) to the project."""
    p = await _get_project(project_id, user["user_id"])
    if any(f["rel_path"] == rel_path for f in (p.get("files") or [])):
        raise HTTPException(409, "File already exists")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(413, "Max 5MB per file")
    ctype = mime_for(rel_path)
    storage_path = f"launchpilot/sites/{user['user_id']}/{project_id}/{rel_path}"
    try:
        put_object(storage_path, data, ctype)
    except Exception:
        raise HTTPException(502, "Storage write failed")
    new_record = {
        "rel_path": rel_path,
        "storage_path": storage_path,
        "size": len(data),
        "content_type": ctype,
    }
    await db.projects.update_one(
        {"project_id": project_id},
        {"$push": {"files": new_record}},
    )
    return new_record
