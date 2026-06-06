"""Iteration 3 — Visual Editor endpoints + OSM lead dedup."""
import io
import os
import uuid
import zipfile
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bizgrowth-ai-9.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@launchpilot.io"
DEMO_PASSWORD = "Demo123!Launch"


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def zip_project(auth_session):
    """Upload a ZIP-based project with index.html + assets/logo.png so we can edit it."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("index.html", "<!doctype html><html><head><title>T</title></head><body><h1>Original</h1></body></html>")
        # 1x1 transparent PNG
        png_bytes = bytes.fromhex(
            "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082"
        )
        z.writestr("assets/logo.png", png_bytes)
    buf.seek(0)
    name = f"TEST_Iter3_{uuid.uuid4().hex[:6]}"
    # multipart upload
    s = requests.Session()
    s.headers.update({"Authorization": auth_session.headers["Authorization"]})
    files = {"file": ("site.zip", buf.getvalue(), "application/zip")}
    data = {"name": name, "description": "iter3 fixture"}
    r = s.post(f"{API}/projects/upload", files=files, data=data)
    assert r.status_code == 200, f"upload-zip failed: {r.status_code} {r.text}"
    p = r.json()
    yield p
    # cleanup
    try:
        auth_session.delete(f"{API}/projects/{p['project_id']}")
    except Exception:
        pass


# ---------- EDITOR ----------
class TestEditorList:
    def test_list_files(self, auth_session, zip_project):
        pid = zip_project["project_id"]
        r = auth_session.get(f"{API}/projects/{pid}/files")
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list) and len(items) >= 2
        paths = [it["rel_path"] for it in items]
        assert "index.html" in paths
        assert "assets/logo.png" in paths
        for it in items:
            assert "rel_path" in it and "size" in it and "content_type" in it
            assert isinstance(it["size"], int) and it["size"] > 0

    def test_list_files_unauth(self, zip_project):
        s = requests.Session()
        r = s.get(f"{API}/projects/{zip_project['project_id']}/files")
        assert r.status_code in (401, 403)

    def test_list_files_other_user(self, zip_project):
        """Register a new user and try to access demo user's project — must 404."""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        email = f"TEST_{uuid.uuid4().hex[:8]}@launchpilot.io"
        rr = s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Other"})
        assert rr.status_code == 200
        tok = rr.json()["token"]
        s.headers.update({"Authorization": f"Bearer {tok}"})
        r = s.get(f"{API}/projects/{zip_project['project_id']}/files")
        assert r.status_code == 404


class TestEditorReadWrite:
    def test_read_html_content(self, auth_session, zip_project):
        pid = zip_project["project_id"]
        r = auth_session.get(f"{API}/projects/{pid}/files/index.html/content")
        assert r.status_code == 200, r.text
        assert "text/html" in r.headers.get("content-type", "")
        assert b"<html" in r.content.lower() or b"<!doctype" in r.content.lower()

    def test_read_missing_file_404(self, auth_session, zip_project):
        pid = zip_project["project_id"]
        r = auth_session.get(f"{API}/projects/{pid}/files/nope.html/content")
        assert r.status_code == 404

    def test_write_html_persists_and_increments_deployments(self, auth_session, zip_project):
        pid = zip_project["project_id"]
        before = auth_session.get(f"{API}/projects/{pid}").json()["project"]["deployments_count"]

        new_html = "<!doctype html><html><body><h1>Edited Heading</h1><p>Updated by test</p></body></html>"
        r = auth_session.put(f"{API}/projects/{pid}/files/index.html", json={"content": new_html})
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True
        assert r.json()["size"] == len(new_html.encode("utf-8"))

        # Verify served content reflects update via public site route
        slug = zip_project["slug"]
        r2 = requests.get(f"{API}/sites/{slug}/")
        assert r2.status_code == 200
        assert "Edited Heading" in r2.text

        # Deployments count incremented and a deployment row with 'edit:' commit_message exists
        detail = auth_session.get(f"{API}/projects/{pid}").json()
        after = detail["project"]["deployments_count"]
        assert after == before + 1
        edit_deps = [d for d in detail["deployments"] if (d.get("commit_message") or "").startswith("edit:")]
        assert len(edit_deps) >= 1
        assert "index.html" in edit_deps[0]["commit_message"]

    def test_write_invalid_body(self, auth_session, zip_project):
        pid = zip_project["project_id"]
        r = auth_session.put(f"{API}/projects/{pid}/files/index.html", json={"content": 12345})
        assert r.status_code == 400

    def test_write_unauth(self, zip_project):
        s = requests.Session()
        r = s.put(f"{API}/projects/{zip_project['project_id']}/files/index.html",
                  json={"content": "<html></html>"})
        assert r.status_code in (401, 403)


class TestEditorImage:
    def test_replace_image_serves_new_bytes(self, auth_session, zip_project):
        pid = zip_project["project_id"]
        slug = zip_project["slug"]
        # New tiny PNG (different bytes than original)
        new_png = (b"\x89PNG\r\n\x1a\n" + b"\x00" * 8 + b"REPLACED_BYTES_PAYLOAD" + b"\x00" * 8)
        files = {"file": ("logo.png", new_png, "image/png")}
        s = requests.Session()
        s.headers.update({"Authorization": auth_session.headers["Authorization"]})
        r = s.post(f"{API}/projects/{pid}/files/assets/logo.png/replace-image", files=files)
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True
        # Public serve should return the new bytes
        served = requests.get(f"{API}/sites/{slug}/assets/logo.png")
        assert served.status_code == 200
        assert served.content == new_png
        assert "image/png" in served.headers.get("content-type", "")

    def test_replace_image_unauth(self, zip_project):
        s = requests.Session()
        files = {"file": ("logo.png", b"\x89PNG", "image/png")}
        r = s.post(f"{API}/projects/{zip_project['project_id']}/files/assets/logo.png/replace-image", files=files)
        assert r.status_code in (401, 403)

    def test_replace_missing_image_404(self, auth_session, zip_project):
        pid = zip_project["project_id"]
        s = requests.Session()
        s.headers.update({"Authorization": auth_session.headers["Authorization"]})
        files = {"file": ("x.png", b"\x89PNG\r\n", "image/png")}
        r = s.post(f"{API}/projects/{pid}/files/doesnotexist.png/replace-image", files=files)
        assert r.status_code == 404


class TestEditorAddFile:
    def test_upload_new_file(self, auth_session, zip_project):
        pid = zip_project["project_id"]
        slug = zip_project["slug"]
        s = requests.Session()
        s.headers.update({"Authorization": auth_session.headers["Authorization"]})
        files = {"file": ("about.html", b"<html><body>About page</body></html>", "text/html")}
        data = {"rel_path": "about.html"}
        r = s.post(f"{API}/projects/{pid}/files/upload", files=files, data=data)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["rel_path"] == "about.html"
        assert body["size"] > 0
        # File appears in listing
        listing = auth_session.get(f"{API}/projects/{pid}/files").json()
        assert any(f["rel_path"] == "about.html" for f in listing)
        # Public route serves it
        served = requests.get(f"{API}/sites/{slug}/about.html")
        assert served.status_code == 200
        assert b"About page" in served.content

    def test_upload_duplicate_409(self, auth_session, zip_project):
        pid = zip_project["project_id"]
        s = requests.Session()
        s.headers.update({"Authorization": auth_session.headers["Authorization"]})
        files = {"file": ("index.html", b"<html></html>", "text/html")}
        data = {"rel_path": "index.html"}
        r = s.post(f"{API}/projects/{pid}/files/upload", files=files, data=data)
        assert r.status_code == 409


# ---------- OSM DEDUP ----------
class TestOSMDedup:
    def test_dedup_on_repeated_call(self, auth_session):
        # First call
        r1 = auth_session.get(f"{API}/leads",
                              params={"source": "real", "industry": "Dental", "location": "Burlington, VT"},
                              timeout=60)
        assert r1.status_code == 200, r1.text
        first = r1.json()
        assert isinstance(first, list)

        # Second call
        r2 = auth_session.get(f"{API}/leads",
                              params={"source": "real", "industry": "Dental", "location": "Burlington, VT"},
                              timeout=60)
        assert r2.status_code == 200
        second = r2.json()
        assert isinstance(second, list)

        # Now verify no (business_name, location) duplicates in user's OSM leads.
        # Pull all the user's leads from /api/leads (filtered to Burlington/Dental)
        all_my = auth_session.get(f"{API}/leads",
                                  params={"industry": "Dental", "location": "Burlington, VT", "limit": 500}).json()
        osm = [l for l in all_my if l.get("source") == "osm" and l.get("user_id")]
        keys = [(l["business_name"].lower(), (l.get("location") or "").lower()) for l in osm]
        assert len(keys) == len(set(keys)), f"Duplicates detected in OSM leads: {len(keys) - len(set(keys))}"
