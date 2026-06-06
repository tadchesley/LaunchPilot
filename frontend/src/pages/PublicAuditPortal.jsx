import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, API_URL } from "@/lib/api";
import { ScoreRing, Badge } from "@/components/ui-bits";
import { AlertTriangle, Lightbulb, Download } from "lucide-react";

export default function PublicAuditPortal() {
  const { token } = useParams();
  const [a, setA] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get(`/portal/audit/${token}`).then(r => setA(r.data)).catch(() => setErr("This share link is invalid or expired."));
  }, [token]);

  const downloadPdf = () => {
    window.open(`${API_URL}/portal/audit/${token}/pdf`, "_blank");
  };

  if (err) return <div className="min-h-screen flex items-center justify-center bg-white text-gray-700">{err}</div>;
  if (!a) return <div className="min-h-screen flex items-center justify-center bg-white text-gray-500">Loading…</div>;

  const brand = a.brand || {};
  const brandColor = brand.color || "#000";
  const logoUrl = brand.logo_url ? `${API_URL.replace(/\/api$/, "")}${brand.logo_url}` : null;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-8"/>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center text-white font-bold" style={{ background: brandColor }}>
                {(brand.name || "L")[0]}
              </div>
            )}
            <div className="font-semibold">{brand.name || "LaunchPilot"}</div>
          </div>
          <button onClick={downloadPdf} className="text-sm border border-gray-300 hover:border-gray-500 px-3 py-1.5 rounded inline-flex items-center gap-2">
            <Download size={14}/> Download PDF
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-xs text-gray-500">Website audit · {new Date(a.created_at).toLocaleDateString()}</div>
        <h1 className="text-3xl font-bold mt-1 tracking-tight">{a.url}</h1>

        <div className="mt-8 flex flex-wrap items-center gap-8 border-b border-gray-200 pb-8">
          <ScoreRing value={a.overall_score} size={130} label="Overall"/>
          <div className="grid grid-cols-3 gap-4 flex-1 min-w-[260px]">
            {Object.entries(a.scores || {}).map(([k, v]) => (
              <div key={k}>
                <div className="text-xs uppercase tracking-wide text-gray-500 capitalize">{k}</div>
                <div className={"text-2xl font-bold mt-1 " + (v >= 80 ? "text-green-600" : v >= 55 ? "text-yellow-600" : "text-red-600")}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-5 border-l-4 bg-gray-50" style={{ borderColor: brandColor }}>
          <div className="font-medium mb-2">Executive summary</div>
          <p className="text-gray-700 leading-relaxed">{a.summary}</p>
        </div>

        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle size={16} className="text-red-600"/><h2 className="font-semibold">Issues detected</h2></div>
          <div className="space-y-3">
            {(a.issues || []).map((i, idx) => (
              <div key={idx} className="border border-gray-200 rounded p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] uppercase tracking-wide text-gray-500">{i.category}</span>
                  <span className={"text-[11px] font-medium uppercase tracking-wide " + (i.severity === "high" ? "text-red-600" : i.severity === "medium" ? "text-yellow-600" : "text-gray-500")}>{i.severity}</span>
                </div>
                <div className="font-medium">{i.title}</div>
                <div className="text-gray-600 mt-1 text-sm">{i.description}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4"><Lightbulb size={16} className="text-green-600"/><h2 className="font-semibold">Recommendations</h2></div>
          <div className="space-y-3">
            {(a.recommendations || []).map((r, idx) => (
              <div key={idx} className="border border-gray-200 rounded p-4">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">Priority · {r.priority}</span>
                <div className="font-medium mt-2">{r.title}</div>
                <div className="text-gray-600 mt-1 text-sm">{r.description}</div>
                {r.impact && <div className="text-green-700 text-xs mt-2">→ {r.impact}</div>}
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          Prepared by {brand.name || "LaunchPilot"}
        </footer>
      </main>
    </div>
  );
}
