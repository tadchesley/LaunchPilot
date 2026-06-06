"""Lead Finder routes — seeded mock leads with search + opportunity scoring."""
import random
import hashlib
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from ..auth import require_user
from ..db import db, utcnow
from ..models import gen_id

router = APIRouter(prefix="/api/leads", tags=["leads"])


INDUSTRIES = [
    "Dental", "Real Estate", "Restaurant", "E-commerce", "SaaS", "Law Firm",
    "Healthcare", "Auto Repair", "Fitness", "Marketing Agency", "Construction",
    "Education", "Hospitality", "Wedding", "Photography",
]
LOCATIONS = [
    "New York, NY", "Austin, TX", "San Francisco, CA", "Miami, FL", "Chicago, IL",
    "Seattle, WA", "Boston, MA", "Denver, CO", "Los Angeles, CA", "Atlanta, GA",
    "Portland, OR", "Brooklyn, NY",
]
SIZES = ["1-10", "11-50", "51-200", "201-500"]
TECH = ["WordPress", "Shopify", "Wix", "Squarespace", "Webflow", "React", "Next.js",
        "GoDaddy Builder", "Jekyll", "Custom HTML"]

FIRST = ["Sarah", "Marcus", "Priya", "Daniel", "Aisha", "Liam", "Sofia", "Ethan",
         "Olivia", "Noah", "Maya", "Carlos", "Jin", "Hannah", "Yusuf"]
LAST = ["Chen", "Patel", "Rodriguez", "Kim", "Anderson", "Okafor", "Müller",
        "Johansson", "Silva", "Nguyen", "Thompson", "Hassan"]
TITLES = ["Owner", "Founder", "Marketing Director", "CEO", "Operations Lead",
          "Head of Growth", "Practice Manager"]

BUSINESS_PREFIX = ["Bright", "North", "Pulse", "Apex", "Summit", "Iron", "Lumen",
                   "Coastal", "Vertex", "Anchor", "Sable", "Origin", "Halcyon", "Nimbus"]
BUSINESS_SUFFIX = {
    "Dental": "Dental Studio", "Real Estate": "Realty Group",
    "Restaurant": "Kitchen", "E-commerce": "Goods Co.", "SaaS": "Labs",
    "Law Firm": "Legal", "Healthcare": "Health Clinic",
    "Auto Repair": "Auto Works", "Fitness": "Strength Co.",
    "Marketing Agency": "Agency", "Construction": "Builders",
    "Education": "Learning", "Hospitality": "Hotels",
    "Wedding": "Events", "Photography": "Studio",
}


def make_lead(seed: int) -> dict:
    rng = random.Random(seed)
    industry = rng.choice(INDUSTRIES)
    biz = f"{rng.choice(BUSINESS_PREFIX)} {BUSINESS_SUFFIX[industry]}"
    domain = biz.lower().replace(" ", "").replace(".", "").replace(",", "")[:18] + ".com"
    seo = rng.randint(20, 90)
    quality = rng.randint(20, 90)
    opp = max(0, min(100, round((100 - (seo + quality) / 2) + rng.randint(-8, 12))))
    first = rng.choice(FIRST)
    last = rng.choice(LAST)
    return {
        "lead_id": gen_id("lead"),
        "user_id": None,
        "business_name": biz,
        "website": f"https://{domain}",
        "industry": industry,
        "location": rng.choice(LOCATIONS),
        "employee_count": rng.choice(SIZES),
        "tech_stack": rng.sample(TECH, k=rng.randint(1, 3)),
        "seo_score": seo,
        "website_quality": quality,
        "opportunity_score": opp,
        "contact_name": f"{first} {last}",
        "contact_email": f"{first.lower()}@{domain}",
        "contact_title": rng.choice(TITLES),
        "linkedin": f"https://linkedin.com/in/{first.lower()}-{last.lower()}",
        "notes": None,
        "created_at": utcnow().isoformat(),
    }


async def ensure_seed():
    count = await db.leads.count_documents({"user_id": None})
    if count >= 80:
        return
    docs = [make_lead(i) for i in range(120)]
    await db.leads.insert_many(docs)


@router.get("")
async def search_leads(
    industry: Optional[str] = None,
    location: Optional[str] = None,
    size: Optional[str] = None,
    min_opportunity: Optional[int] = None,
    q: Optional[str] = Query(default=None),
    limit: int = 50,
    user=Depends(require_user),
):
    await ensure_seed()
    filt: dict = {}
    if industry and industry.lower() != "all":
        filt["industry"] = industry
    if location and location.lower() != "all":
        filt["location"] = location
    if size and size.lower() != "all":
        filt["employee_count"] = size
    if min_opportunity is not None:
        filt["opportunity_score"] = {"$gte": min_opportunity}
    if q:
        filt["$or"] = [
            {"business_name": {"$regex": q, "$options": "i"}},
            {"industry": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.leads.find(filt, {"_id": 0}).sort("opportunity_score", -1).limit(limit)
    return await cursor.to_list(limit)


@router.get("/filters")
async def get_filters(user=Depends(require_user)):
    await ensure_seed()
    return {
        "industries": INDUSTRIES,
        "locations": LOCATIONS,
        "sizes": SIZES,
    }


@router.get("/{lead_id}")
async def get_lead(lead_id: str, user=Depends(require_user)):
    lead = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(404, "Not found")
    return lead


@router.post("/{lead_id}/save")
async def save_lead_note(lead_id: str, body: dict, user=Depends(require_user)):
    note = body.get("notes", "")
    await db.leads.update_one({"lead_id": lead_id}, {"$set": {"notes": note}})
    return {"ok": True}
