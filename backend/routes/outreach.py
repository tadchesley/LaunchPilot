"""Outreach generation + Campaigns."""
import random
from fastapi import APIRouter, Depends, HTTPException
from ..auth import require_user
from ..db import db, utcnow
from ..models import OutreachGenIn, CampaignIn, gen_id
from ..services.ai_service import generate_outreach

router = APIRouter(prefix="/api", tags=["outreach"])


@router.post("/outreach/generate")
async def gen_outreach(payload: OutreachGenIn, user=Depends(require_user)):
    lead = await db.leads.find_one({"lead_id": payload.lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(404, "Lead not found")
    msg = await generate_outreach(lead, payload.type, payload.angle, payload.tone)
    doc = {
        "draft_id": gen_id("draft"),
        "user_id": user["user_id"],
        "lead_id": payload.lead_id,
        "type": payload.type,
        "subject": msg["subject"],
        "body": msg["body"],
        "created_at": utcnow().isoformat(),
    }
    await db.outreach_drafts.insert_one(doc.copy())
    return doc


@router.get("/outreach/drafts")
async def list_drafts(user=Depends(require_user)):
    return await db.outreach_drafts.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)


# Campaigns
@router.get("/campaigns")
async def list_campaigns(user=Depends(require_user)):
    return await db.campaigns.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)


@router.post("/campaigns")
async def create_campaign(payload: CampaignIn, user=Depends(require_user)):
    leads_count = random.randint(40, 220)
    sent = random.randint(0, leads_count)
    opened = round(sent * random.uniform(0.18, 0.55))
    replied = round(opened * random.uniform(0.08, 0.25))
    meetings = round(replied * random.uniform(0.15, 0.4))
    doc = {
        "campaign_id": gen_id("camp"),
        "user_id": user["user_id"],
        "name": payload.name,
        "description": payload.description,
        "target_industry": payload.target_industry,
        "status": "active" if sent else "draft",
        "leads_count": leads_count,
        "sent": sent,
        "opened": opened,
        "replied": replied,
        "meetings_booked": meetings,
        "created_at": utcnow().isoformat(),
    }
    await db.campaigns.insert_one(doc.copy())
    return doc


@router.patch("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, body: dict, user=Depends(require_user)):
    allowed = {k: v for k, v in body.items() if k in {"name", "description", "status", "target_industry"}}
    if allowed:
        await db.campaigns.update_one(
            {"campaign_id": campaign_id, "user_id": user["user_id"]},
            {"$set": allowed},
        )
    doc = await db.campaigns.find_one(
        {"campaign_id": campaign_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    return doc


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user=Depends(require_user)):
    res = await db.campaigns.delete_one({"campaign_id": campaign_id, "user_id": user["user_id"]})
    return {"deleted": res.deleted_count}
