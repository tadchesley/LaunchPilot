"""LaunchPilot iteration 2 backend tests - ZIP deploy, OSM leads, CSV import,
notifications, PDF, share portal, brand, monitoring."""
import io
import os
import time
import uuid
import zipfile
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://bizgrowth-ai-9.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@launchpilot.io"
DEMO_PASSWORD = "Demo123!Launch"


@pytest.fixture(scope="module")
def auth_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# ---------- ZIP deploy + site serve ----------
class TestZipUpload:
    project_id = None
    slug = None

    def test_upload_zip(self, headers):
        # Build an in-memory zip with index.html + extra css
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w") as zf:
            zf.writestr("index.html", "<html><body><h1>HELLO LP TEST</h1></body></html>")
            zf.writestr("style.css", "body{background:#fff}")
        zip_buf.seek(0)
        files = {"file": ("test_site.zip", zip_buf.getvalue(), "application/zip")}
        data = {"name": "TEST_ZipSite", "description": "qa zip"}
        r = requests.post(f"{API}/projects/upload", files=files, data=data, headers=headers, timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["files"] >= 2
        assert body["live_url"].startswith("/api/sites/")
        TestZipUpload.project_id = body["project_id"]
        TestZipUpload.slug = body["slug"]

    def test_serve_site_root(self):
        slug = TestZipUpload.slug
        r = requests.get(f"{API}/sites/{slug}/", timeout=60)
        assert r.status_code == 200, r.text
        assert "text/html" in r.headers.get("content-type", "")
        assert b"HELLO LP TEST" in r.content

    def test_serve_site_css(self):
        slug = TestZipUpload.slug
        r = requests.get(f"{API}/sites/{slug}/style.css", timeout=60)
        assert r.status_code == 200
        assert "text/css" in r.headers.get("content-type", "")
        assert b"background" in r.content

    def test_cleanup(self, headers):
        if TestZipUpload.project_id:
            requests.delete(f"{API}/projects/{TestZipUpload.project_id}", headers=headers)


# ---------- OSM real leads ----------
class TestRealLeads:
    def test_fetch_real_dental_burlington(self, headers):
        r = requests.get(
            f"{API}/leads",
            params={"source": "real", "industry": "Dental", "location": "Burlington, VT", "limit": 30},
            headers=headers,
            timeout=60,
        )
        assert r.status_code == 200, r.text
        leads = r.json()
        assert isinstance(leads, list)
        # Should pull >=5 OSM results per task; be lenient: at least 3
        assert len(leads) >= 3, f"Got only {len(leads)} OSM leads: {leads}"
        for l in leads:
            assert l.get("business_name")
            assert l.get("location")
        assert any(l.get("source") == "osm" for l in leads), "no lead has source='osm'"

    def test_csv_import(self, headers):
        csv_data = (
            "business_name,website,industry,location\n"
            "TEST_Acme One,acme1.example.com,SaaS,Austin TX\n"
            "TEST_Acme Two,https://acme2.example.com,Dental,Boston MA\n"
            "TEST_Acme Three,acme3.example.com,Restaurant,Miami FL\n"
        )
        files = {"file": ("leads.csv", csv_data.encode("utf-8"), "text/csv")}
        r = requests.post(f"{API}/leads/import", files=files, headers=headers, timeout=60)
        assert r.status_code == 200, r.text
        assert r.json()["inserted"] == 3
        # verify they show up
        r2 = requests.get(f"{API}/leads", params={"q": "TEST_Acme"}, headers=headers, timeout=30)
        assert r2.status_code == 200
        found = [l for l in r2.json() if l.get("business_name", "").startswith("TEST_Acme")]
        assert len(found) >= 3
        assert all(l.get("source") == "csv" for l in found)


# ---------- Notifications ----------
class TestNotifications:
    def test_list_notifications(self, headers):
        r = requests.get(f"{API}/notifications", headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "notifications" in body
        assert "unread" in body
        assert isinstance(body["notifications"], list)
        assert isinstance(body["unread"], int)

    def test_mark_all_read(self, headers):
        r = requests.post(f"{API}/notifications/read-all", headers=headers, timeout=30)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- Audits PDF + Share Portal ----------
class TestAuditExtras:
    audit_id = None
    share_token = None

    def _ensure_audit(self, headers):
        r = requests.get(f"{API}/audits", headers=headers, timeout=30)
        assert r.status_code == 200
        items = r.json()
        if items:
            return items[0]["audit_id"]
        # else create one
        r = requests.post(f"{API}/audits", json={"url": "example.com"}, headers=headers, timeout=90)
        assert r.status_code == 200
        return r.json()["audit_id"]

    def test_audit_pdf(self, headers):
        TestAuditExtras.audit_id = self._ensure_audit(headers)
        r = requests.get(f"{API}/audits/{TestAuditExtras.audit_id}/pdf", headers=headers, timeout=60)
        assert r.status_code == 200, r.text
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert r.content[:4] == b"%PDF", "PDF magic bytes missing"
        assert len(r.content) > 5000, f"PDF too small: {len(r.content)} bytes"

    def test_share_create(self, headers):
        aid = TestAuditExtras.audit_id or self._ensure_audit(headers)
        TestAuditExtras.audit_id = aid
        r = requests.post(f"{API}/audits/{aid}/share", headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("share_token")
        assert body.get("share_url")
        TestAuditExtras.share_token = body["share_token"]

    def test_public_portal_no_auth(self):
        # NO Authorization header
        token = TestAuditExtras.share_token
        assert token, "share_token missing from previous test"
        r = requests.get(f"{API}/portal/audit/{token}", timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("audit_id") == TestAuditExtras.audit_id
        assert "brand" in body
        assert "name" in body["brand"]

    def test_portal_invalid_token(self):
        r = requests.get(f"{API}/portal/audit/invalid_token_xyz", timeout=15)
        assert r.status_code == 404


# ---------- Brand ----------
class TestBrand:
    def test_get_brand(self, headers):
        r = requests.get(f"{API}/brand", headers=headers, timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert "brand_name" in body
        assert "brand_color" in body

    def test_update_brand(self, headers):
        r = requests.post(f"{API}/brand", json={"brand_name": "TEST_QA Agency", "brand_color": "#ff5722"}, headers=headers, timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert body["brand_name"] == "TEST_QA Agency"
        assert body["brand_color"] == "#ff5722"
        # GET again
        r2 = requests.get(f"{API}/brand", headers=headers, timeout=30)
        assert r2.json()["brand_name"] == "TEST_QA Agency"

    def test_upload_logo(self, headers):
        # 1x1 png
        png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0"
            b"\x00\x00\x00\x03\x00\x01\x5e\xf3\x2a\x3a\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"file": ("logo.png", png, "image/png")}
        r = requests.post(f"{API}/uploads/logo", files=files, headers=headers, timeout=60)
        assert r.status_code == 200, r.text
        url = r.json().get("logo_url")
        assert url and url.startswith("/api/assets/")
        # serve back
        r2 = requests.get(f"{BASE_URL}{url}", timeout=30)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")


# ---------- Monitoring ----------
class TestMonitoring:
    project_id = None

    def test_create_project_and_check(self, headers):
        # Create a small project to monitor (URL deploy path)
        r = requests.post(f"{API}/projects", json={
            "name": "TEST_MonProj", "description": "QA monitor", "source_url": "https://example.com"
        }, headers=headers, timeout=30)
        assert r.status_code == 200
        TestMonitoring.project_id = r.json()["project_id"]

    def test_force_check(self, headers):
        pid = TestMonitoring.project_id
        r = requests.post(f"{API}/monitoring/{pid}/check", headers=headers, timeout=60)
        assert r.status_code == 200
        body = r.json()
        assert "status" in body
        assert body["status"] in ("up", "down", "unknown")

    def test_get_monitoring(self, headers):
        pid = TestMonitoring.project_id
        r = requests.get(f"{API}/monitoring/{pid}", headers=headers, timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert "checks" in body
        assert "summary" in body
        assert "uptime_pct" in body["summary"]
        assert isinstance(body["summary"]["uptime_pct"], (int, float))

    def test_cleanup(self, headers):
        if TestMonitoring.project_id:
            requests.delete(f"{API}/projects/{TestMonitoring.project_id}", headers=headers)
