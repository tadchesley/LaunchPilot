import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader, ScoreRing } from "@/components/ui-bits";
import { AlertTriangle, Lightbulb, Download } from "lucide-react";

export default function AuditDetail() {
  const { auditId } = useParams();
  const [a, setA] = useState(null);

  useEffect(() => {
    api.get(`/audits/${auditId}`).then(r => setA(r.data));
  }, [auditId]);

  if (!a) return <div className="p-10 font-mono text-sm text-zinc-500">loading…</div>;

  const sev = { high: "text-[#E5484D]", medium: "text-[#FFE629]", low: "text-zinc-400" };

  return (
    <div>
      <PageHeader
        overline="/ audit report"
        title={a.url}
        subtitle={a.summary}
        actions={
          <button onClick={() => window.print()} className="btn-secondary inline-flex items-center gap-2">
            <Download size={14}/> Export
          </button>
        }
      />

      <div className="px-10 py-8">
        <div className="border border-white/10 bg-[#0A0A0A] p-8 flex flex-wrap items-center gap-10">
          <ScoreRing value={a.overall_score} size={140} label="overall score"/>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-white/10 border border-white/10 flex-1 min-w-[300px]">
            {Object.entries(a.scores).map(([k, v]) => (
              <div key={k} className="bg-[#0A0A0A] p-4">
                <div className="overline">{k}</div>
                <div className={"font-mono text-2xl mt-2 " + (v >= 80 ? "text-[#00E599]" : v >= 55 ? "text-[#FFE629]" : "text-[#E5484D]")}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-px bg-white/10 border border-white/10">
          <div className="bg-[#0A0A0A] p-6">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle size={14} className="text-[#E5484D]"/>
              <div className="overline">/ issues detected</div>
            </div>
            <div className="space-y-4">
              {(a.issues || []).length === 0 && <div className="text-zinc-500 text-sm font-mono">no issues detected</div>}
              {(a.issues || []).map((i, idx) => (
                <div key={idx} className="border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{i.category}</div>
                    <div className={"font-mono text-[10px] uppercase " + (sev[i.severity] || sev.low)}>{i.severity}</div>
                  </div>
                  <div className="text-sm mt-2">{i.title}</div>
                  <div className="text-zinc-400 text-sm mt-1 leading-relaxed">{i.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0A0A] p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb size={14} className="text-[#00E599]"/>
              <div className="overline">/ ai recommendations</div>
            </div>
            <div className="space-y-4">
              {(a.recommendations || []).length === 0 && <div className="text-zinc-500 text-sm font-mono">no recommendations</div>}
              {(a.recommendations || []).map((r, idx) => (
                <div key={idx} className="border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">priority · {r.priority}</div>
                  </div>
                  <div className="text-sm mt-2 font-medium">{r.title}</div>
                  <div className="text-zinc-400 text-sm mt-1 leading-relaxed">{r.description}</div>
                  {r.impact && (
                    <div className="mt-2 font-mono text-[11px] text-[#00E599]">→ {r.impact}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
