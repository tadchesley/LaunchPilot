"""Uploads (ZIP deploys + logo branding) routes."""
import io
import zipfile
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header, Query, Response
from ..auth import require_user, get_user_from_token
from ..db import db, utcnow
from ..models import gen_id
from ..services.storage_service import put_object, get_object, make_user_path, mime_for

router = APIRouter(prefix="/api", tags=["uploads"])
logger = logging.getLogger(__name__)

MAX_ZIP_BYTES = 25 * 1024 * 1024  # 25 MB
ALLOWED_DEPLOY_EXTS = {
    "html", "htm", "css", "js", "json", "svg", "png", "jpg", "jpeg",
    "gif", "webp", "ico", "woff", "woff2", "ttf", "txt", "xml", "map"
}


def _slugify(name: str) -> str:
    import re
    s = re.sub(r"[^a-z0-9-]+", "-", name.lower()).strip("-")
    return s or "project"


@router.post("/projects/upload")
async def upload_zip(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    user=Depends(require_user),
):
    """Accept a ZIP, extract static files, upload each to object storage, create project."""
    data = await file.read()
    if len(data) > MAX_ZIP_BYTES:
        raise HTTPException(413, f"Zip too large (max {MAX_ZIP_BYTES // (1024 * 1024)} MB)")
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(400, "Expected a .zip file")

    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile:
        raise HTTPException(400, "Invalid zip file")

    project_id = gen_id("prj")
    slug = _slugify(name) + "-" + project_id.split("_", 1)[1][:6]
    file_records = []

    # Find common root prefix (some zips put everything inside a folder)
    members = [n for n in zf.namelist() if not n.endswith("/")]
    if not members:
        raise HTTPException(400, "Zip is empty")
    common = members[0].split("/")[0] + "/" if "/" in members[0] else ""
    if not all(m.startswith(common) for m in members):
        common = ""

    has_index = False
    for member in members:
        rel = member[len(common):] if common else member
        if not rel or rel.startswith("__MACOSX") or rel.startswith("."):
            continue
        ext = rel.rsplit(".", 1)[-1].lower() if "." in rel else ""
        if ext not in ALLOWED_DEPLOY_EXTS:
            continue  # silently skip unsupported types
        try:
            content = zf.read(member)
        except Exception:
            continue
        storage_path = f"launchpilot/sites/{user['user_id']}/{project_id}/{rel}"
        try:
            put_object(storage_path, content, mime_for(rel))
        except Exception as e:
            logger.warning(f"Storage put failed for {rel}: {e}")
            continue
        file_records.append({
            "rel_path": rel,
            "storage_path": storage_path,
            "size": len(content),
            "content_type": mime_for(rel),
        })
        if rel.lower() in {"index.html", "index.htm"}:
            has_index = True

    if not file_records:
        raise HTTPException(400, "No supported files were found in the zip")

    now = utcnow().isoformat()
    live_url = f"/api/sites/{slug}/"
    doc = {
        "project_id": project_id,
        "user_id": user["user_id"],
        "name": name,
        "slug": slug,
        "live_url": live_url,
        "status": "ready",
        "environment": "production",
        "framework": "static",
        "description": description or None,
        "source_url": None,
        "files": file_records,
        "has_index": has_index,
        "created_at": now,
        "last_deployed_at": now,
        "deployments_count": 1,
        "build_seconds": 1,
    }
    await db.projects.insert_one(doc.copy())
    await db.deployments.insert_one({
        "deployment_id": gen_id("dep"),
        "project_id": project_id,
        "user_id": user["user_id"],
        "status": "ready",
        "environment": "production",
        "commit_message": f"zip upload: {file.filename}",
        "duration_seconds": 1,
        "files_count": len(file_records),
        "created_at": now,
    })
    return {"project_id": project_id, "slug": slug, "live_url": live_url, "files": len(file_records)}


@router.get("/sites/{slug}/{path:path}")
async def serve_site(slug: str, path: str = ""):
    """Public static site serve for an uploaded ZIP deployment."""
    project = await db.projects.find_one({"slug": slug}, {"_id": 0})
    if not project:
        raise HTTPException(404, "Site not found")
    rel = path or "index.html"
    if rel.endswith("/"):
        rel = rel + "index.html"
    storage_path = None
    for f in project.get("files", []):
        if f["rel_path"] == rel:
            storage_path = f["storage_path"]
            content_type = f["content_type"]
            break
    if not storage_path:
        # try index fallback for SPA-style paths
        for f in project.get("files", []):
            if f["rel_path"] in ("index.html", "index.htm"):
                storage_path = f["storage_path"]
                content_type = f["content_type"]
                break
    if not storage_path:
        raise HTTPException(404, "File not found")
    try:
        content, _ = get_object(storage_path)
    except Exception:
        raise HTTPException(502, "Could not fetch from storage")
    return Response(content=content, media_type=content_type)


# trailing-slash variant
@router.get("/sites/{slug}/")
async def serve_site_root(slug: str):
    return await serve_site(slug, "")


@router.get("/sites/{slug}")
async def serve_site_root_no_slash(slug: str):
    return await serve_site(slug, "")


@router.post("/uploads/logo")
async def upload_logo(file: UploadFile = File(...), user=Depends(require_user)):
    """Upload a brand logo to be used in white-label portals + PDF reports."""
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in {"png", "jpg", "jpeg", "svg", "webp"}:
        raise HTTPException(400, "Image must be png/jpg/svg/webp")
    data = await file.read()
    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(413, "Logo must be < 2MB")
    path = make_user_path(user["user_id"], ext, kind="brand")
    put_object(path, data, mime_for(file.filename or f"x.{ext}"))
    await db.brand.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"logo_path": path, "logo_filename": file.filename}},
        upsert=True,
    )
    return {"logo_url": f"/api/assets/{path}"}


@router.get("/assets/{path:path}")
async def serve_asset(path: str, auth: str | None = Query(None), authorization: str | None = Header(None)):
    """Serve a stored asset. Public for branding assets so they can render in <img>."""
    try:
        content, ctype = get_object(path)
    except Exception:
        raise HTTPException(404, "Not found")
    return Response(content=content, media_type=ctype)
