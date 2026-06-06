"""Real lead source via OpenStreetMap (Overpass + Nominatim) — free, no API key.

We translate user filters (industry, location text) into Overpass QL queries and
return businesses as Lead-shaped dicts. Results are merged with our seed pool so
the user always has something to act on.
"""
import logging
import re
import hashlib
import asyncio
import httpx
from datetime import datetime, timezone

from ..models import gen_id

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "LaunchPilot/1.0 (https://launchpilot.app)"

# Map our industry labels to OSM tags
INDUSTRY_TAGS = {
    "Dental": [("amenity", "dentist")],
    "Real Estate": [("office", "estate_agent")],
    "Restaurant": [("amenity", "restaurant")],
    "E-commerce": [("shop", "*")],
    "SaaS": [("office", "it"), ("office", "company")],
    "Law Firm": [("office", "lawyer")],
    "Healthcare": [("amenity", "clinic"), ("amenity", "doctors")],
    "Auto Repair": [("shop", "car_repair")],
    "Fitness": [("leisure", "fitness_centre"), ("leisure", "sports_centre")],
    "Marketing Agency": [("office", "advertising_agency"), ("office", "marketing")],
    "Construction": [("office", "construction"), ("craft", "builder")],
    "Education": [("amenity", "school"), ("amenity", "language_school")],
    "Hospitality": [("tourism", "hotel")],
    "Wedding": [("shop", "wedding")],
    "Photography": [("craft", "photographer"), ("shop", "photo")],
}


async def _geocode(location: str) -> tuple[float, float, float, float] | None:
    """Return bbox (south, west, north, east) for a location string."""
    if not location:
        return None
    try:
        async with httpx.AsyncClient(timeout=15, headers={"User-Agent": USER_AGENT}) as ac:
            r = await ac.get(NOMINATIM_URL, params={"q": location, "format": "json", "limit": 1})
            data = r.json()
            if not data:
                return None
            box = data[0].get("boundingbox")
            if not box or len(box) != 4:
                return None
            s, n, w, e = float(box[0]), float(box[1]), float(box[2]), float(box[3])
            return (s, w, n, e)
    except Exception as ex:
        logger.warning(f"Nominatim error: {ex}")
        return None


def _build_overpass(bbox: tuple, industry: str, limit: int = 30) -> str:
    tags = INDUSTRY_TAGS.get(industry, [("shop", "*")])
    s, w, n, e = bbox
    parts = []
    for k, v in tags:
        if v == "*":
            parts.append(f'nwr["{k}"]({s},{w},{n},{e});')
        else:
            parts.append(f'nwr["{k}"="{v}"]({s},{w},{n},{e});')
    body = "\n".join(parts)
    return f"""[out:json][timeout:25];
(
{body}
);
out tags center {limit};"""


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())[:20] or "business"


def _score(seed: str, lo: int, hi: int) -> int:
    h = int(hashlib.sha256(seed.encode()).hexdigest()[:8], 16)
    return lo + (h % (hi - lo + 1))


def _to_lead(el: dict, industry: str, location: str) -> dict | None:
    tags = el.get("tags") or {}
    name = tags.get("name") or tags.get("brand")
    if not name:
        return None
    website = (tags.get("website") or tags.get("contact:website") or "").strip()
    if website and not website.startswith(("http://", "https://")):
        website = "https://" + website
    if not website:
        website = f"https://{_slug(name)}.example"
    addr = ", ".join(
        v for v in [
            tags.get("addr:street"),
            tags.get("addr:city") or tags.get("addr:town"),
            tags.get("addr:state") or tags.get("addr:province"),
        ] if v
    ) or location
    seed = f"{name}|{website}"
    # If the business has no website listed in OSM, opportunity is high
    has_real_site = bool(tags.get("website") or tags.get("contact:website"))
    seo = _score(seed + "seo", 25, 85)
    quality = _score(seed + "q", 25, 85)
    if not has_real_site:
        seo = min(seo, 35)
        quality = min(quality, 30)
    opp = max(0, min(100, round((100 - (seo + quality) / 2) + (0 if has_real_site else 18))))
    email = tags.get("contact:email") or tags.get("email")
    phone = tags.get("contact:phone") or tags.get("phone")
    return {
        "lead_id": gen_id("lead"),
        "user_id": None,
        "business_name": name,
        "website": website,
        "industry": industry,
        "location": addr,
        "employee_count": "1-10",
        "tech_stack": ["WordPress"] if has_real_site else ["No website"],
        "seo_score": seo,
        "website_quality": quality,
        "opportunity_score": opp,
        "contact_name": None,
        "contact_email": email,
        "contact_title": "Owner",
        "linkedin": None,
        "notes": None,
        "source": "osm",
        "phone": phone,
        "has_real_website": has_real_site,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def fetch_real_leads(industry: str, location: str, limit: int = 30) -> list[dict]:
    """Fetch real businesses from OpenStreetMap via Overpass. Returns [] on failure."""
    if not location:
        return []
    bbox = await _geocode(location)
    if not bbox:
        return []
    query = _build_overpass(bbox, industry or "E-commerce", limit=limit)
    try:
        async with httpx.AsyncClient(timeout=30, headers={"User-Agent": USER_AGENT}) as ac:
            r = await ac.post(OVERPASS_URL, data={"data": query})
            r.raise_for_status()
            data = r.json()
    except Exception as ex:
        logger.warning(f"Overpass error: {ex}")
        return []
    leads = []
    for el in (data.get("elements") or [])[:limit]:
        lead = _to_lead(el, industry or "E-commerce", location)
        if lead:
            leads.append(lead)
    leads.sort(key=lambda x: x["opportunity_score"], reverse=True)
    return leads
