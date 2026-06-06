import React, { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";
import { Link } from "react-router-dom";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Activity } from "lucide-react";
import { toast } from "sonner";

export default function Audits() {
  const [audits, setAudits] = useState([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await api.get("/audits");
    setAudits(data);
  };
  useEffect(() => { load(); }, []);

  const run = async (e) => {
    e.preventDefault();
    if (!url) return;
    setBusy(true);
    try {
      const { data } = await api.post("/audits", { url });
      toast.success("Audit complete");
      setUrl("");
      setAudits(prev => [data, ...prev]);
    } catch {
      toast.error("Audit failed");
    } finally { setBusy(false); }
  };

  const colorOf = v => v >= 80 ? "text-[#00E599]" : v >= 55 ? "text-[#FFE629]" : "text-[#E5484D]";

  return (
    <div data-testid="audits-page">
      <PageHeader
        title="AI audits"
        subtitle="Score any website on SEO, speed, mobile, accessibility, conversion and security. Get a client-ready report in seconds."
      />
      <div className="px-8 py-8">
        <form onSubmit={run} className="bg-[#0A0A0A] border border-white/10 rounded-md p-5 mb-8">
          <div className="text-sm font-medium mb-3">Run a new audit</div>
          <div className="flex flex-wrap gap-3">
            <input
              required value={url} onChange={e=>setUrl(e.target.value)}
              data-testid="audit-url-input"
              placeholder="https://example.com"
              className="flex-1 min-w-[260px] bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" />
            <button type="submit" disabled={busy} data-testid="audit-run-btn" className="btn-primary inline-flex items-center gap-2">
              <Activity size={14}/> {busy ? "Auditing…" : "Run audit"}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-3">Audits take about 10 seconds. We use Claude to generate recommendations.</p>
        </form>

        {audits.length === 0 ? (
          <EmptyState icon={Activity} title="No audits yet" description="Enter a URL above to run your first audit." />
        ) : (
          <div className="border border-white/10 rounded-md overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500 bg-[#0A0A0A]">
              <div className="col-span-4">Website</div>
              <div className="col-span-1">SEO</div>
              <div className="col-span-1">Speed</div>
              <div className="col-span-1">A11y</div>
              <div className="col-span-1">Mobile</div>
              <div className="col-span-1">Conv</div>
              <div className="col-span-1">Sec</div>
              <div className="col-span-2 text-right">Overall</div>
            </div>
            {audits.map(a => (
              <div key={a.audit_id} className="grid grid-cols-12 px-5 py-4 border-b border-white/5 hover:bg-white/[0.03] items-center">
                <Link to={`/audits/${a.audit_id}`} data-testid={`audit-row-${a.audit_id}`} className="col-span-4">
                  <div className="text-sm truncate">{a.url}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">{new Date(a.created_at).toLocaleDateString()}</div>
                </Link>
                <div className={"col-span-1 " + colorOf(a.scores.seo)}>{a.scores.seo}</div>
                <div className={"col-span-1 " + colorOf(a.scores.performance)}>{a.scores.performance}</div>
                <div className={"col-span-1 " + colorOf(a.scores.accessibility)}>{a.scores.accessibility}</div>
                <div className={"col-span-1 " + colorOf(a.scores.mobile)}>{a.scores.mobile}</div>
                <div className={"col-span-1 " + colorOf(a.scores.conversion)}>{a.scores.conversion}</div>
                <div className={"col-span-1 " + colorOf(a.scores.security)}>{a.scores.security}</div>
                <div className="col-span-2 text-right font-display text-2xl tracking-tight">{a.overall_score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
