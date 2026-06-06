"""AI Website Audit routes — runs heuristic scoring + Claude-generated findings."""
import random
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from ..auth import require_user
from ..db import db, utcnow
from ..models import AuditIn, gen_id
from ..services.ai_service import generate_audit_insights

router = APIRouter(prefix="/api/audits", tags=["audits"])


def deterministic_scores(url: str) -> dict:
    """Generate stable pseudo-random scores from a URL hash (for MVP demo)."""
    h = hashlib.sha256(url.encode()).digest()
    seed = int.from_bytes(h[:8], "big")
    rng = random.Random(seed)
    return {
        "seo": rng.randint(35, 92),
        "performance": rng.randint(30, 95),
        "accessibility": rng.randint(40, 95),
        "mobile": rng.randint(45, 98),
        "conversion": rng.randint(25, 85),
        "security": rng.randint(55, 99),
    }


@router.post("")
async def run_audit(payload: AuditIn, user=Depends(require_user)):
    url = payload.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    scores = deterministic_scores(url)
    overall = round(sum(scores.values()) / len(scores))
    ai = await generate_audit_insights(url, scores)
    now = utcnow().isoformat()
    doc = {
        "audit_id": gen_id("aud"),
        "user_id": user["user_id"],
        "url": url,
        "project_id": payload.project_id,
        "lead_id": payload.lead_id,
        "scores": scores,
        "overall_score": overall,
        "issues": ai.get("issues", []),
        "recommendations": ai.get("recommendations", []),
        "summary": ai.get("summary", ""),
        "created_at": now,
    }
    await db.audits.insert_one(doc.copy())
    return doc


@router.get("")
async def list_audits(user=Depends(require_user)):
    return await db.audits.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)


@router.get("/{audit_id}")
async def get_audit(audit_id: str, user=Depends(require_user)):
    a = await db.audits.find_one({"audit_id": audit_id, "user_id": user["user_id"]}, {"_id": 0})
    if not a:
        raise HTTPException(404, "Not found")
    return a
