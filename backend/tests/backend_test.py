"""LaunchPilot backend API tests (pytest).

Covers: auth (register/login/me/logout/emergent session),
projects CRUD + deploy, audits (Claude), leads search + filters,
outreach generation + campaigns, CRM kanban + dashboard stats.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bizgrowth-ai-9.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@launchpilot.io"
DEMO_PASSWORD = "Demo123!Launch"


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_token(session):
    """Login as the demo user; if missing, register fresh user."""
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    if r.status_code == 200:
        return r.json()["token"]
    # fallback: register a brand-new throwaway user
    email = f"TEST_{uuid.uuid4().hex[:8]}@launchpilot.io"
    r = session.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass123!", "name": "Test User"
    })
    assert r.status_code == 200, f"register fallback failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_client(session, auth_token):
    session.headers.update({"Authorization": f"Bearer {auth_token}"})
    return session


# ---------- HEALTH ----------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}")
        assert r.status_code == 200
        body = r.json()
        assert body.get("service") == "launchpilot"
        assert body.get("status") == "ok"

    def test_health(self, session):
        r = session.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------- AUTH ----------
class TestAuth:
    def test_register_new_user(self, session):
        email = f"TEST_{uuid.uuid4().hex[:8]}@launchpilot.io"
        r = session.post(f"{API}/auth/register", json={
            "email": email, "password": "TestPass123!", "name": "Reg Test"
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert "token" in body and isinstance(body["token"], str)
        assert body["user"]["email"] == email
        assert body["user"]["auth_provider"] == "password"
        assert "password_hash" not in body["user"]

    def test_register_duplicate_email(self, session):
        r = session.post(f"{API}/auth/register", json={
            "email": DEMO_EMAIL, "password": DEMO_PASSWORD, "name": "Dup"
        })
        assert r.status_code == 400

    def test_login_demo_user(self, session):
        r = session.post(f"{API}/auth/login", json={
            "email": DEMO_EMAIL, "password": DEMO_PASSWORD
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["user"]["email"] == DEMO_EMAIL
        assert "token" in body

    def test_login_invalid_credentials(self, session):
        r = session.post(f"{API}/auth/login", json={
            "email": DEMO_EMAIL, "password": "wrong-pass"
        })
        assert r.status_code == 401

    def test_me_with_bearer(self, session, auth_token):
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {auth_token}"})
        assert r.status_code == 200
        body = r.json()
        assert "user_id" in body
        assert body.get("email")

    def test_me_without_token(self, session):
        # Use fresh session to avoid leftover cookies
        s2 = requests.Session()
        r = s2.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_logout(self, session, auth_token):
        r = session.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {auth_token}"})
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_emergent_session_invalid(self, session):
        r = session.post(f"{API}/auth/session", json={"session_id": "invalid-xyz-123"})
        # should be 4xx — either 400/401/500 from upstream, but NOT 200
        assert r.status_code != 200
        assert r.status_code >= 400

    def test_emergent_session_missing_id(self, session):
        r = session.post(f"{API}/auth/session", json={})
        assert r.status_code == 400


# ---------- PROJECTS ----------
class TestProjects:
    created_project_id = None

    def test_create_project(self, auth_client):
        r = auth_client.post(f"{API}/projects", json={
            "name": "TEST_Project_Alpha", "description": "QA project"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Project_Alpha"
        assert data["live_url"].startswith("https://")
        assert "launchpilot.app" in data["live_url"]
        assert data["deployments_count"] == 1
        assert "project_id" in data
        TestProjects.created_project_id = data["project_id"]

    def test_list_projects(self, auth_client):
        r = auth_client.get(f"{API}/projects")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert any(p["project_id"] == TestProjects.created_project_id for p in items)

    def test_get_project_detail(self, auth_client):
        pid = TestProjects.created_project_id
        r = auth_client.get(f"{API}/projects/{pid}")
        assert r.status_code == 200
        body = r.json()
        assert body["project"]["project_id"] == pid
        assert isinstance(body["deployments"], list)
        assert len(body["deployments"]) >= 1

    def test_redeploy_increments_count(self, auth_client):
        pid = TestProjects.created_project_id
        before = auth_client.get(f"{API}/projects/{pid}").json()["project"]["deployments_count"]
        r = auth_client.post(f"{API}/projects/{pid}/deploy")
        assert r.status_code == 200
        assert r.json().get("ok") is True
        after = auth_client.get(f"{API}/projects/{pid}").json()["project"]["deployments_count"]
        assert after == before + 1

    def test_delete_project(self, auth_client):
        pid = TestProjects.created_project_id
        r = auth_client.delete(f"{API}/projects/{pid}")
        assert r.status_code == 200
        assert r.json().get("deleted") >= 1
        r2 = auth_client.get(f"{API}/projects/{pid}")
        assert r2.status_code == 404


# ---------- AUDITS ----------
class TestAudits:
    created_audit_id = None

    def test_run_audit(self, auth_client):
        r = auth_client.post(f"{API}/audits", json={"url": "example.com"}, timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()
        for k in ("seo", "performance", "accessibility", "mobile", "conversion", "security"):
            assert isinstance(body["scores"][k], int)
        assert 0 <= body["overall_score"] <= 100
        assert isinstance(body["issues"], list)
        assert isinstance(body["recommendations"], list)
        # Claude integration: should produce non-empty list
        assert len(body["issues"]) > 0, "Claude returned empty issues"
        assert len(body["recommendations"]) > 0, "Claude returned empty recommendations"
        TestAudits.created_audit_id = body["audit_id"]

    def test_list_audits(self, auth_client):
        r = auth_client.get(f"{API}/audits")
        assert r.status_code == 200
        assert any(a["audit_id"] == TestAudits.created_audit_id for a in r.json())

    def test_get_audit(self, auth_client):
        aid = TestAudits.created_audit_id
        r = auth_client.get(f"{API}/audits/{aid}")
        assert r.status_code == 200
        assert r.json()["audit_id"] == aid


# ---------- LEADS ----------
class TestLeads:
    sample_lead_id = None

    def test_list_leads(self, auth_client):
        r = auth_client.get(f"{API}/leads")
        assert r.status_code == 200
        leads = r.json()
        assert isinstance(leads, list)
        assert len(leads) >= 1
        l = leads[0]
        for k in ("lead_id", "business_name", "industry", "opportunity_score"):
            assert k in l
        TestLeads.sample_lead_id = l["lead_id"]

    def test_filters(self, auth_client):
        r = auth_client.get(f"{API}/leads/filters")
        assert r.status_code == 200
        data = r.json()
        assert len(data["industries"]) > 0
        assert len(data["locations"]) > 0
        assert len(data["sizes"]) > 0

    def test_filter_by_industry(self, auth_client):
        r = auth_client.get(f"{API}/leads", params={"industry": "Dental"})
        assert r.status_code == 200
        leads = r.json()
        for l in leads:
            assert l["industry"] == "Dental"

    def test_search_query(self, auth_client):
        r = auth_client.get(f"{API}/leads", params={"q": "Dental"})
        assert r.status_code == 200
        # search matches industry/business_name/location
        assert isinstance(r.json(), list)

    def test_min_opportunity_filter(self, auth_client):
        r = auth_client.get(f"{API}/leads", params={"min_opportunity": 60})
        assert r.status_code == 200
        for l in r.json():
            assert l["opportunity_score"] >= 60

    def test_get_lead_detail(self, auth_client):
        r = auth_client.get(f"{API}/leads/{TestLeads.sample_lead_id}")
        assert r.status_code == 200
        assert r.json()["lead_id"] == TestLeads.sample_lead_id

    def test_get_lead_404(self, auth_client):
        r = auth_client.get(f"{API}/leads/lead_nonexistent_xyz")
        assert r.status_code == 404


# ---------- OUTREACH ----------
class TestOutreach:
    draft_id = None

    def test_generate_outreach(self, auth_client):
        # need a real lead first
        leads = auth_client.get(f"{API}/leads").json()
        lid = leads[0]["lead_id"]
        r = auth_client.post(f"{API}/outreach/generate", json={
            "lead_id": lid, "type": "cold_email", "tone": "professional"
        }, timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["subject"] and isinstance(body["subject"], str)
        assert body["body"] and len(body["body"]) > 20
        TestOutreach.draft_id = body["draft_id"]

    def test_list_drafts(self, auth_client):
        r = auth_client.get(f"{API}/outreach/drafts")
        assert r.status_code == 200
        assert any(d["draft_id"] == TestOutreach.draft_id for d in r.json())

    def test_generate_outreach_invalid_lead(self, auth_client):
        r = auth_client.post(f"{API}/outreach/generate", json={
            "lead_id": "lead_does_not_exist", "type": "cold_email"
        })
        assert r.status_code == 404


# ---------- CAMPAIGNS ----------
class TestCampaigns:
    campaign_id = None

    def test_create_campaign(self, auth_client):
        r = auth_client.post(f"{API}/campaigns", json={
            "name": "TEST_Q1_Outbound", "target_industry": "Dental"
        })
        assert r.status_code == 200
        c = r.json()
        assert c["name"] == "TEST_Q1_Outbound"
        for k in ("sent", "opened", "replied", "meetings_booked", "leads_count"):
            assert k in c
        TestCampaigns.campaign_id = c["campaign_id"]

    def test_list_campaigns(self, auth_client):
        r = auth_client.get(f"{API}/campaigns")
        assert r.status_code == 200
        assert any(c["campaign_id"] == TestCampaigns.campaign_id for c in r.json())

    def test_patch_campaign(self, auth_client):
        r = auth_client.patch(f"{API}/campaigns/{TestCampaigns.campaign_id}", json={
            "status": "paused"
        })
        assert r.status_code == 200
        assert r.json()["status"] == "paused"

    def test_delete_campaign(self, auth_client):
        r = auth_client.delete(f"{API}/campaigns/{TestCampaigns.campaign_id}")
        assert r.status_code == 200
        assert r.json()["deleted"] >= 1


# ---------- CRM ----------
class TestCRM:
    contact_id = None

    def test_create_contact(self, auth_client):
        r = auth_client.post(f"{API}/crm/contacts", json={
            "name": "TEST_John Doe", "company": "Acme", "email": "j@acme.com"
        })
        assert r.status_code == 200
        c = r.json()
        assert c["stage"] == "new_lead"
        TestCRM.contact_id = c["contact_id"]

    def test_list_contacts(self, auth_client):
        r = auth_client.get(f"{API}/crm/contacts")
        assert r.status_code == 200
        body = r.json()
        assert "stages" in body and "contacts" in body
        expected = ["new_lead", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]
        assert body["stages"] == expected

    def test_update_stage(self, auth_client):
        r = auth_client.patch(
            f"{API}/crm/contacts/{TestCRM.contact_id}/stage",
            json={"stage": "qualified"}
        )
        assert r.status_code == 200
        assert r.json()["stage"] == "qualified"

    def test_update_stage_invalid(self, auth_client):
        r = auth_client.patch(
            f"{API}/crm/contacts/{TestCRM.contact_id}/stage",
            json={"stage": "garbage_stage"}
        )
        assert r.status_code == 400

    def test_delete_contact(self, auth_client):
        r = auth_client.delete(f"{API}/crm/contacts/{TestCRM.contact_id}")
        assert r.status_code == 200


# ---------- DASHBOARD ----------
class TestDashboard:
    def test_stats(self, auth_client):
        r = auth_client.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        s = r.json()
        for k in ("projects", "audits_completed", "leads_available", "deals_won",
                  "emails_sent", "open_rate", "reply_rate"):
            assert k in s
        assert s["leads_available"] >= 80
