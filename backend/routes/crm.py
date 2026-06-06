"""CRM kanban + dashboard stats routes."""
from fastapi import APIRouter, Depends, HTTPException
from ..auth import require_user
from ..db import db, utcnow
from ..models import CRMContactIn, StageUpdate, PIPELINE_STAGES, gen_id

router = APIRouter(prefix="/api", tags=["crm"])


@router.get("/crm/contacts")
async def list_contacts(user=Depends(require_user)):
    docs = await db.crm_contacts.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("updated_at", -1).to_list(500)
    return {"stages": PIPELINE_STAGES, "contacts": docs}


@router.post("/crm/contacts")
async def create_contact(payload: CRMContactIn, user=Depends(require_user)):
    if payload.stage not in PIPELINE_STAGES:
        raise HTTPException(400, "Invalid stage")
    now = utcnow().isoformat()
    doc = {
        "contact_id": gen_id("ctc"),
        "user_id": user["user_id"],
        "name": payload.name,
        "company": payload.company,
        "email": payload.email,
        "phone": payload.phone,
        "website": payload.website,
        "stage": payload.stage,
        "value": payload.value,
        "notes": payload.notes,
        "lead_id": payload.lead_id,
        "activities": [{"type": "created", "at": now}],
        "created_at": now,
        "updated_at": now,
    }
    await db.crm_contacts.insert_one(doc.copy())
    return doc


@router.patch("/crm/contacts/{contact_id}/stage")
async def update_stage(contact_id: str, payload: StageUpdate, user=Depends(require_user)):
    if payload.stage not in PIPELINE_STAGES:
        raise HTTPException(400, "Invalid stage")
    now = utcnow().isoformat()
    await db.crm_contacts.update_one(
        {"contact_id": contact_id, "user_id": user["user_id"]},
        {"$set": {"stage": payload.stage, "updated_at": now},
         "$push": {"activities": {"type": "stage_change", "to": payload.stage, "at": now}}},
    )
    doc = await db.crm_contacts.find_one(
        {"contact_id": contact_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    return doc


@router.patch("/crm/contacts/{contact_id}")
async def update_contact(contact_id: str, body: dict, user=Depends(require_user)):
    allowed = {k: v for k, v in body.items() if k in
               {"name", "company", "email", "phone", "website", "value", "notes", "stage"}}
    if "stage" in allowed and allowed["stage"] not in PIPELINE_STAGES:
        raise HTTPException(400, "Invalid stage")
    allowed["updated_at"] = utcnow().isoformat()
    await db.crm_contacts.update_one(
        {"contact_id": contact_id, "user_id": user["user_id"]}, {"$set": allowed}
    )
    return await db.crm_contacts.find_one(
        {"contact_id": contact_id, "user_id": user["user_id"]}, {"_id": 0}
    )


@router.delete("/crm/contacts/{contact_id}")
async def delete_contact(contact_id: str, user=Depends(require_user)):
    r = await db.crm_contacts.delete_one({"contact_id": contact_id, "user_id": user["user_id"]})
    return {"deleted": r.deleted_count}


@router.get("/dashboard/stats")
async def dashboard_stats(user=Depends(require_user)):
    uid = user["user_id"]
    projects = await db.projects.count_documents({"user_id": uid})
    audits = await db.audits.count_documents({"user_id": uid})
    leads = await db.leads.count_documents({})  # global pool of available leads
    drafts = await db.outreach_drafts.count_documents({"user_id": uid})
    contacts = await db.crm_contacts.count_documents({"user_id": uid})
    won = await db.crm_contacts.count_documents({"user_id": uid, "stage": "won"})
    campaigns = await db.campaigns.find({"user_id": uid}, {"_id": 0}).to_list(500)
    sent = sum(c.get("sent", 0) for c in campaigns)
    opened = sum(c.get("opened", 0) for c in campaigns)
    replied = sum(c.get("replied", 0) for c in campaigns)
    meetings = sum(c.get("meetings_booked", 0) for c in campaigns)

    won_value = 0
    async for c in db.crm_contacts.find({"user_id": uid, "stage": "won"}, {"_id": 0, "value": 1}):
        won_value += c.get("value", 0) or 0

    return {
        "projects": projects,
        "audits_completed": audits,
        "leads_available": leads,
        "drafts_generated": drafts,
        "contacts": contacts,
        "deals_won": won,
        "won_value": won_value,
        "emails_sent": sent,
        "emails_opened": opened,
        "replies": replied,
        "meetings_booked": meetings,
        "open_rate": round((opened / sent * 100) if sent else 0, 1),
        "reply_rate": round((replied / sent * 100) if sent else 0, 1),
    }
