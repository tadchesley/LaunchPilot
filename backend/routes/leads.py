"""Lead Finder routes — seeded mock leads + real OpenStreetMap source + CSV import."""
import csv
import io
import random
import hashlib
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from typing import Optional
from ..auth import require_user
from ..db import db, utcnow
from ..models import gen_id
from ..services.osm_leads import fetch_real_leads, INDUSTRY_TAGS

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
    source: Optional[str] = Query(default=None),  # "real" to fetch from OSM
    limit: int = 50,
    user=Depends(require_user),
):
    await ensure_seed()
    # Real OSM source — fetch live, dedupe vs user's existing leads, save and return
    if source == "real" and location:
        leads = await fetch_real_leads(industry or "E-commerce", location, limit=min(limit, 30))
        if not leads:
            return []
        # Dedupe by (business_name, location) against existing user-scoped leads
        existing = await db.leads.find(
            {"user_id": user["user_id"], "source": "osm"},
            {"_id": 0, "business_name": 1, "location": 1, "website": 1}
        ).to_list(2000)
        seen = {(e["business_name"].lower(), (e.get("location") or "").lower()) for e in existing}
        seen_sites = {(e.get("website") or "").lower() for e in existing if e.get("website")}
        new_leads, duplicates = [], []
        for l in leads:
            key = (l["business_name"].lower(), (l.get("location") or "").lower())
            site = (l.get("website") or "").lower()
            if key in seen or (site and site in seen_sites):
                duplicates.append(l)
                continue
            l["user_id"] = user["user_id"]
            new_leads.append(l)
            seen.add(key)
            if site:
                seen_sites.add(site)
        if new_leads:
            await db.leads.insert_many([dict(x) for x in new_leads])
        # Return new + already-existing matches (so the UI shows everything the user wanted)
        result = list(new_leads)
        if duplicates:
            # fetch existing user docs that match the duplicate keys to keep UI consistent
            dup_names = [d["business_name"] for d in duplicates]
            existing_full = await db.leads.find(
                {"user_id": user["user_id"], "business_name": {"$in": dup_names}}, {"_id": 0}
            ).to_list(500)
            result.extend(existing_full)
        result.sort(key=lambda x: x.get("opportunity_score", 0), reverse=True)
        return result

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
    # Include user's own leads + global seed leads
    filt = {"$and": [filt, {"$or": [{"user_id": None}, {"user_id": user["user_id"]}]}]} if filt else \
        {"$or": [{"user_id": None}, {"user_id": user["user_id"]}]}
    cursor = db.leads.find(filt, {"_id": 0}).sort("opportunity_score", -1).limit(limit)
    return await cursor.to_list(limit)


@router.post("/import")
async def import_csv(file: UploadFile = File(...), user=Depends(require_user)):
    """Import leads from a CSV. Columns (any subset): business_name,website,industry,location,
    employee_count,contact_name,contact_email,contact_title,phone."""
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    inserted = 0
    docs = []
    for row in reader:
        name = (row.get("business_name") or row.get("name") or row.get("company") or "").strip()
        if not name:
            continue
        website = (row.get("website") or row.get("url") or "").strip()
        if website and not website.startswith(("http://", "https://")):
            website = "https://" + website
        seed = (name + website).encode()
        h = int(hashlib.sha256(seed).hexdigest()[:8], 16)
        rng = random.Random(h)
        seo = rng.randint(25, 75)
        quality = rng.randint(25, 75)
        opp = max(0, min(100, round((100 - (seo + quality) / 2) + rng.randint(-5, 15))))
        docs.append({
            "lead_id": gen_id("lead"),
            "user_id": user["user_id"],
            "business_name": name,
            "website": website or f"https://{name.lower().replace(' ', '')}.example",
            "industry": (row.get("industry") or "E-commerce").strip(),
            "location": (row.get("location") or "").strip() or "—",
            "employee_count": (row.get("employee_count") or "1-10").strip(),
            "tech_stack": [],
            "seo_score": seo,
            "website_quality": quality,
            "opportunity_score": opp,
            "contact_name": (row.get("contact_name") or "").strip() or None,
            "contact_email": (row.get("contact_email") or row.get("email") or "").strip() or None,
            "contact_title": (row.get("contact_title") or row.get("title") or "").strip() or None,
            "phone": (row.get("phone") or "").strip() or None,
            "linkedin": None,
            "notes": None,
            "source": "csv",
            "created_at": utcnow().isoformat(),
        })
        inserted += 1
    if docs:
        await db.leads.insert_many(docs)
    return {"inserted": inserted}


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
