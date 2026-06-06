"""Claude Sonnet 4.5 AI service via Emergent Universal LLM Key."""
import os
import json
import re
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-5-20250929"


def _make_chat(session_id: str, system_message: str) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)


def _extract_json(text: str):
    """Robustly extract a JSON object from an LLM response."""
    if not text:
        return None
    # Strip code fences
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except Exception:
            pass
    # Try to find first balanced JSON object
    first = text.find("{")
    last = text.rfind("}")
    if first != -1 and last != -1 and last > first:
        candidate = text[first:last + 1]
        try:
            return json.loads(candidate)
        except Exception:
            pass
    return None


async def generate_audit_insights(url: str, scores: dict) -> dict:
    """Ask Claude for issues + recommendations + summary, given scores."""
    chat = _make_chat(
        session_id=f"audit-{url}",
        system_message=(
            "You are a world-class website auditor. Return ONLY valid JSON. "
            "No markdown, no commentary."
        ),
    )
    prompt = f"""Analyze the website {url} based on the scoring snapshot below and produce findings.

Scores (0-100): {json.dumps(scores)}

Respond with strict JSON in this shape:
{{
  "summary": "2-3 sentence executive summary highlighting the biggest opportunities",
  "issues": [
    {{"severity": "high|medium|low", "category": "seo|performance|accessibility|mobile|conversion|security", "title": "...", "description": "..."}}
  ],
  "recommendations": [
    {{"priority": "high|medium|low", "title": "...", "description": "concrete action", "impact": "expected business impact"}}
  ]
}}

Provide 4-6 issues and 4-6 recommendations. Be specific and actionable."""
    try:
        resp = await chat.send_message(UserMessage(text=prompt))
        data = _extract_json(resp) or {}
        return {
            "summary": data.get("summary", "Audit completed."),
            "issues": data.get("issues", []),
            "recommendations": data.get("recommendations", []),
        }
    except Exception as e:
        return {
            "summary": f"Heuristic audit completed for {url}.",
            "issues": [],
            "recommendations": [],
            "error": str(e),
        }


async def generate_outreach(lead: dict, outreach_type: str, angle: str | None, tone: str | None) -> dict:
    """Generate a personalized outreach message."""
    chat = _make_chat(
        session_id=f"outreach-{lead.get('lead_id', 'x')}-{outreach_type}",
        system_message=(
            "You are an elite SDR copywriter. Write highly personalized, concise, "
            "non-pushy outreach. Return ONLY valid JSON."
        ),
    )
    lead_brief = {
        "business_name": lead.get("business_name"),
        "website": lead.get("website"),
        "industry": lead.get("industry"),
        "location": lead.get("location"),
        "seo_score": lead.get("seo_score"),
        "website_quality": lead.get("website_quality"),
        "opportunity_score": lead.get("opportunity_score"),
        "contact_name": lead.get("contact_name"),
        "contact_title": lead.get("contact_title"),
    }
    prompt = f"""Write a {outreach_type.replace('_', ' ')} for the following lead.

LEAD:
{json.dumps(lead_brief, indent=2)}

ANGLE: {angle or 'website performance and conversion improvements'}
TONE: {tone or 'professional, friendly, concise'}

Rules:
- 90-130 words for body
- Mention one specific observation from the lead data
- Include one soft CTA at the end (ask a question, propose 15-min chat)
- No emojis. No exclamation marks.
- Subject must be lowercase and under 7 words.

Return JSON:
{{ "subject": "...", "body": "..." }}"""
    try:
        resp = await chat.send_message(UserMessage(text=prompt))
        data = _extract_json(resp) or {}
        return {
            "subject": data.get("subject") or "quick question about your site",
            "body": data.get("body") or resp,
        }
    except Exception as e:
        return {
            "subject": "quick question about your site",
            "body": f"Hi {lead.get('contact_name') or 'there'} — I took a quick look at {lead.get('website')} and noticed a few opportunities. Open to a 15-min chat?",
            "error": str(e),
        }


async def generate_landing_page_copy(business_name: str, industry: str, description: str, audience: str) -> dict:
    chat = _make_chat(
        session_id=f"landing-{business_name}",
        system_message="You are a senior conversion copywriter. Return ONLY JSON.",
    )
    prompt = f"""Create landing-page copy for:
- Business: {business_name}
- Industry: {industry}
- Description: {description}
- Audience: {audience}

Return JSON:
{{
  "headline": "...",
  "subheadline": "...",
  "cta_primary": "...",
  "cta_secondary": "...",
  "features": [{{"title":"...","description":"..."}}],
  "faq": [{{"q":"...","a":"..."}}]
}}
Provide 4 features and 4 FAQs."""
    try:
        resp = await chat.send_message(UserMessage(text=prompt))
        return _extract_json(resp) or {"raw": resp}
    except Exception as e:
        return {"error": str(e)}
