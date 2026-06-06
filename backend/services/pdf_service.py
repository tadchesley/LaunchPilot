"""Server-side PDF audit report generation via WeasyPrint."""
from datetime import datetime
from weasyprint import HTML


def _color(v: int) -> str:
    if v >= 80:
        return "#16a34a"
    if v >= 55:
        return "#ca8a04"
    return "#dc2626"


def render_audit_html(audit: dict, brand: dict | None = None) -> str:
    brand = brand or {}
    brand_name = brand.get("name") or "LaunchPilot"
    brand_color = brand.get("color") or "#000000"
    logo_url = brand.get("logo_url")

    scores = audit.get("scores", {})
    issues = audit.get("issues") or []
    recs = audit.get("recommendations") or []
    overall = audit.get("overall_score", 0)
    url = audit.get("url", "")
    summary = audit.get("summary", "")
    created = audit.get("created_at", "")
    try:
        created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
        created_str = created_dt.strftime("%B %d, %Y")
    except Exception:
        created_str = created

    score_rows = "".join(
        f'<tr><td style="padding:8px 0;text-transform:capitalize;">{k}</td>'
        f'<td style="padding:8px 0;text-align:right;color:{_color(v)};font-weight:600;">{v}</td></tr>'
        for k, v in scores.items()
    )

    def issue_block(i):
        sev = (i.get("severity") or "low").upper()
        sev_color = {"HIGH": "#dc2626", "MEDIUM": "#ca8a04", "LOW": "#6b7280"}.get(sev, "#6b7280")
        return f"""
        <div class="card">
          <div class="row-between">
            <span class="tag">{i.get("category", "")}</span>
            <span class="tag" style="color:{sev_color};border-color:{sev_color}33;">{sev}</span>
          </div>
          <div class="title">{i.get("title", "")}</div>
          <div class="body">{i.get("description", "")}</div>
        </div>"""

    def rec_block(r):
        return f"""
        <div class="card">
          <div class="row-between">
            <span class="tag">PRIORITY · {(r.get("priority") or "").upper()}</span>
          </div>
          <div class="title">{r.get("title", "")}</div>
          <div class="body">{r.get("description", "")}</div>
          {f'<div class="impact">Impact: {r.get("impact")}</div>' if r.get("impact") else ""}
        </div>"""

    issues_html = "".join(issue_block(i) for i in issues) or '<div class="muted">No critical issues found.</div>'
    recs_html = "".join(rec_block(r) for r in recs) or '<div class="muted">No recommendations.</div>'

    logo_html = (
        f'<img src="{logo_url}" alt="logo" style="height:32px;"/>'
        if logo_url
        else f'<div style="width:32px;height:32px;background:{brand_color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">{brand_name[0]}</div>'
    )

    return f"""
<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
@page {{ size: A4; margin: 24mm 18mm; }}
body {{ font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color:#111; font-size:11pt; line-height:1.55; }}
h1 {{ font-size: 28pt; margin: 0; letter-spacing: -0.02em; }}
h2 {{ font-size: 14pt; margin: 28pt 0 10pt; letter-spacing: -0.01em; }}
.header {{ display:flex; align-items:center; justify-content:space-between; padding-bottom: 14pt; border-bottom: 1px solid #e5e7eb; }}
.brand {{ display:flex; align-items:center; gap: 10px; font-weight: 600; }}
.muted {{ color:#6b7280; font-size: 10pt; }}
.overall {{ display:flex; align-items:flex-end; gap: 18pt; margin-top: 18pt; }}
.overall .num {{ font-size: 64pt; line-height:1; font-weight: 700; color: {_color(overall)}; }}
.scores table {{ width:100%; border-collapse: collapse; font-size:11pt; }}
.scores td {{ border-bottom: 1px solid #f3f4f6; }}
.summary {{ background:#f9fafb; padding: 12pt 14pt; border-left: 3px solid {brand_color}; margin-top: 10pt; }}
.card {{ border: 1px solid #e5e7eb; padding: 10pt 12pt; margin: 8pt 0; page-break-inside: avoid; border-radius: 4px; }}
.row-between {{ display:flex; justify-content: space-between; }}
.tag {{ font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.1em; color:#6b7280; border:1px solid #e5e7eb; padding: 2px 6px; border-radius: 3px; }}
.title {{ font-weight: 600; margin-top: 6pt; }}
.body {{ font-size: 10.5pt; color: #374151; margin-top: 4pt; }}
.impact {{ font-size: 10pt; color:#16a34a; margin-top: 6pt; }}
.footer {{ margin-top: 28pt; padding-top: 12pt; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 9pt; text-align: center; }}
</style></head>
<body>
  <div class="header">
    <div class="brand">{logo_html}<span>{brand_name}</span></div>
    <div class="muted">Website audit · {created_str}</div>
  </div>

  <h1 style="margin-top: 24pt;">Website Audit Report</h1>
  <div class="muted" style="margin-top:4pt;">{url}</div>

  <div class="overall">
    <div>
      <div class="muted">Overall score</div>
      <div class="num">{overall}</div>
    </div>
    <div style="flex:1;" class="scores">
      <table>{score_rows}</table>
    </div>
  </div>

  <div class="summary">{summary}</div>

  <h2>Issues detected</h2>
  {issues_html}

  <h2>Recommendations</h2>
  {recs_html}

  <div class="footer">Generated by {brand_name} · launchpilot.app</div>
</body></html>
"""


def render_audit_pdf(audit: dict, brand: dict | None = None) -> bytes:
    html = render_audit_html(audit, brand)
    return HTML(string=html).write_pdf()
