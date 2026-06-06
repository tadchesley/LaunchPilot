import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui-bits";
import { Activity, Plus } from "lucide-react";
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
        overline="/ ai audits"
        title="Six-dimension website intelligence"
        subtitle="Run a Claude-powered audit on any public URL. Generate a client-ready report instantly."
      />
      <div className="px-10 py-8">
        <form onSubmit={run} className="border border-white/10 bg-[#0A0A0A] p-6 mb-10">
          <div className="overline mb-3">/ run new audit</div>
          <div className="flex flex-wrap gap-3">
            <input
              required value={url} onChange={e=>setUrl(e.target.value)}
              data-testid="audit-url-input"
              placeholder="https://example.com"
              className="flex-1 min-w-[260px] bg-transparent border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/40" />
            <button type="submit" disabled={busy} data-testid="audit-run-btn" className="btn-primary inline-flex items-center gap-2">
              <Activity size={14}/> {busy ? "Auditing…" : "Run audit"}
            </button>
          </div>
        </form>

        {audits.length === 0 ? (
          <div className="border border-dashed border-white/15 p-16 text-center">
            <Activity className="mx-auto mb-4" size={28}/>
            <div className="font-display text-2xl tracking-tighter">No audits yet</div>
            <div className="text-zinc-500 mt-2">Run your first audit on any public website.</div>
          </div>
        ) : (
          <div className="border border-white/10">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 bg-[#0A0A0A]">
              <div className="col-span-4">url</div>
              <div className="col-span-1">seo</div>
              <div className="col-span-1">perf</div>
              <div className="col-span-1">a11y</div>
              <div className="col-span-1">mobile</div>
              <div className="col-span-1">conv</div>
              <div className="col-span-1">sec</div>
              <div className="col-span-2 text-right">overall</div>
            </div>
            {audits.map(a => (
              <Link key={a.audit_id} to={`/audits/${a.audit_id}`}
                data-testid={`audit-row-${a.audit_id}`}
                className="grid grid-cols-12 px-5 py-4 border-b border-white/5 hover:bg-white/[0.03] items-center">
                <div className="col-span-4">
                  <div className="text-sm truncate">{a.url}</div>
                  <div className="text-zinc-500 font-mono text-[11px] mt-0.5">{new Date(a.created_at).toLocaleString()}</div>
                </div>
                <div className={"col-span-1 font-mono " + colorOf(a.scores.seo)}>{a.scores.seo}</div>
                <div className={"col-span-1 font-mono " + colorOf(a.scores.performance)}>{a.scores.performance}</div>
                <div className={"col-span-1 font-mono " + colorOf(a.scores.accessibility)}>{a.scores.accessibility}</div>
                <div className={"col-span-1 font-mono " + colorOf(a.scores.mobile)}>{a.scores.mobile}</div>
                <div className={"col-span-1 font-mono " + colorOf(a.scores.conversion)}>{a.scores.conversion}</div>
                <div className={"col-span-1 font-mono " + colorOf(a.scores.security)}>{a.scores.security}</div>
                <div className="col-span-2 text-right font-display text-2xl tracking-tighter">{a.overall_score}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
