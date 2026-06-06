"""White-label client portal — public read-only audit + proposal share links + PDF export."""
import secrets
from fastapi import APIRouter, Depends, HTTPException, Response
from ..auth import require_user
from ..db import db, utcnow
from ..services.pdf_service import render_audit_pdf

router = APIRouter(prefix="/api", tags=["portal"])


async def _get_brand(user_id: str) -> dict:
    b = await db.brand.find_one({"user_id": user_id}, {"_id": 0}) or {}
    return {
        "name": b.get("brand_name") or "LaunchPilot",
        "color": b.get("brand_color") or "#000000",
        "logo_url": (f"/api/assets/{b['logo_path']}" if b.get("logo_path") else None),
    }


@router.get("/brand")
async def get_brand(user=Depends(require_user)):
    b = await db.brand.find_one({"user_id": user["user_id"]}, {"_id": 0}) or {}
    return {
        "brand_name": b.get("brand_name") or "",
        "brand_color": b.get("brand_color") or "#000000",
        "logo_url": (f"/api/assets/{b['logo_path']}" if b.get("logo_path") else None),
    }


@router.post("/brand")
async def update_brand(body: dict, user=Depends(require_user)):
    allowed = {k: v for k, v in body.items() if k in {"brand_name", "brand_color"}}
    if allowed:
        await db.brand.update_one(
            {"user_id": user["user_id"]},
            {"$set": allowed},
            upsert=True,
        )
    return await get_brand(user=user)


@router.post("/audits/{audit_id}/share")
async def create_share_link(audit_id: str, user=Depends(require_user)):
    audit = await db.audits.find_one({"audit_id": audit_id, "user_id": user["user_id"]}, {"_id": 0})
    if not audit:
        raise HTTPException(404, "Audit not found")
    token = secrets.token_urlsafe(16)
    await db.shared_audits.insert_one({
        "share_token": token,
        "audit_id": audit_id,
        "user_id": user["user_id"],
        "created_at": utcnow().isoformat(),
    })
    return {"share_token": token, "share_url": f"/portal/audit/{token}"}


@router.get("/portal/audit/{share_token}")
async def portal_audit(share_token: str):
    share = await db.shared_audits.find_one({"share_token": share_token}, {"_id": 0})
    if not share:
        raise HTTPException(404, "Invalid share link")
    audit = await db.audits.find_one({"audit_id": share["audit_id"]}, {"_id": 0})
    if not audit:
        raise HTTPException(404, "Audit not found")
    brand = await _get_brand(share["user_id"])
    audit["brand"] = brand
    return audit


@router.get("/audits/{audit_id}/pdf")
async def audit_pdf(audit_id: str, user=Depends(require_user)):
    audit = await db.audits.find_one({"audit_id": audit_id, "user_id": user["user_id"]}, {"_id": 0})
    if not audit:
        raise HTTPException(404, "Audit not found")
    brand = await _get_brand(user["user_id"])
    pdf_bytes = render_audit_pdf(audit, brand)
    filename = f"audit-{audit_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/portal/audit/{share_token}/pdf")
async def portal_audit_pdf(share_token: str):
    share = await db.shared_audits.find_one({"share_token": share_token}, {"_id": 0})
    if not share:
        raise HTTPException(404, "Invalid share link")
    audit = await db.audits.find_one({"audit_id": share["audit_id"]}, {"_id": 0})
    if not audit:
        raise HTTPException(404, "Audit not found")
    brand = await _get_brand(share["user_id"])
    pdf_bytes = render_audit_pdf(audit, brand)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="audit-{share_token}.pdf"'},
    )
