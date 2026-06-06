"""Pydantic models for LaunchPilot."""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
from datetime import datetime
import uuid


def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


# ---------- AUTH ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    auth_provider: Literal["password", "google"] = "password"
    created_at: datetime


# ---------- PROJECTS / DEPLOYMENTS ----------
class ProjectIn(BaseModel):
    name: str
    source_url: Optional[str] = None  # for clone/import
    description: Optional[str] = None


class Project(BaseModel):
    project_id: str
    user_id: str
    name: str
    slug: str
    live_url: str
    status: Literal["building", "ready", "error", "queued"] = "ready"
    environment: Literal["production", "staging", "preview"] = "production"
    framework: str = "static"
    description: Optional[str] = None
    source_url: Optional[str] = None
    created_at: datetime
    last_deployed_at: datetime
    deployments_count: int = 1


class DeploymentLog(BaseModel):
    deployment_id: str
    project_id: str
    user_id: str
    status: str
    environment: str
    commit_message: Optional[str] = None
    duration_seconds: int = 0
    created_at: datetime


# ---------- AUDITS ----------
class AuditIn(BaseModel):
    url: str
    project_id: Optional[str] = None
    lead_id: Optional[str] = None


class AuditScores(BaseModel):
    seo: int
    performance: int
    accessibility: int
    mobile: int
    conversion: int
    security: int


class Audit(BaseModel):
    audit_id: str
    user_id: str
    url: str
    project_id: Optional[str] = None
    lead_id: Optional[str] = None
    scores: AuditScores
    overall_score: int
    issues: List[dict] = []
    recommendations: List[dict] = []
    summary: str = ""
    created_at: datetime


# ---------- LEADS ----------
class LeadSearch(BaseModel):
    industry: Optional[str] = None
    location: Optional[str] = None
    size: Optional[str] = None
    min_opportunity: Optional[int] = None
    query: Optional[str] = None


class Lead(BaseModel):
    lead_id: str
    user_id: Optional[str] = None  # null for global seed leads
    business_name: str
    website: str
    industry: str
    location: str
    employee_count: str
    tech_stack: List[str] = []
    seo_score: int
    website_quality: int
    opportunity_score: int
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_title: Optional[str] = None
    linkedin: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


# ---------- OUTREACH ----------
class OutreachGenIn(BaseModel):
    lead_id: str
    type: Literal["cold_email", "linkedin", "follow_up", "proposal_intro"] = "cold_email"
    angle: Optional[str] = None  # e.g. "SEO improvement"
    tone: Optional[str] = "professional"


class OutreachDraft(BaseModel):
    draft_id: str
    user_id: str
    lead_id: str
    type: str
    subject: str
    body: str
    created_at: datetime


class CampaignIn(BaseModel):
    name: str
    description: Optional[str] = None
    target_industry: Optional[str] = None


class Campaign(BaseModel):
    campaign_id: str
    user_id: str
    name: str
    description: Optional[str] = None
    target_industry: Optional[str] = None
    status: Literal["draft", "active", "paused", "completed"] = "draft"
    leads_count: int = 0
    sent: int = 0
    opened: int = 0
    replied: int = 0
    meetings_booked: int = 0
    created_at: datetime


# ---------- CRM ----------
PIPELINE_STAGES = ["new_lead", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]


class CRMContactIn(BaseModel):
    name: str
    company: str
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    stage: str = "new_lead"
    value: float = 0
    notes: Optional[str] = None
    lead_id: Optional[str] = None


class CRMContact(BaseModel):
    contact_id: str
    user_id: str
    name: str
    company: str
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    stage: str
    value: float = 0
    notes: Optional[str] = None
    lead_id: Optional[str] = None
    activities: List[dict] = []
    created_at: datetime
    updated_at: datetime


class StageUpdate(BaseModel):
    stage: str
