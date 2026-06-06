import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, API_URL } from "@/lib/api";
import { PageHeader, ScoreRing, Badge } from "@/components/ui-bits";
import { AlertTriangle, Lightbulb, Download, Share2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function AuditDetail() {
  const { auditId } = useParams();
  const [a, setA] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);

  useEffect(() => {
    api.get(`/audits/${auditId}`).then(r => setA(r.data));
  }, [auditId]);

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/audits/${auditId}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-${auditId}.pdf`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not generate PDF");
    }
  };

  const createShare = async () => {
    try {
      const { data } = await api.post(`/audits/${auditId}/share`);
      const fullUrl = window.location.origin + data.share_url;
      setShareUrl(fullUrl);
      navigator.clipboard?.writeText(fullUrl).catch(()=>{});
      toast.success("Share link copied");
    } catch {
      toast.error("Could not create share link");
    }
  };

  if (!a) return <div className="p-10 text-sm text-zinc-500">Loading…</div>;

  return (
    <div>
      <PageHeader
        title={a.url}
        subtitle={a.summary}
        actions={
          <>
            <button onClick={createShare} className="btn-secondary inline-flex items-center gap-2"><Share2 size={14}/> Share</button>
            <button onClick={downloadPdf} data-testid="audit-pdf-btn" className="btn-primary inline-flex items-center gap-2"><Download size={14}/> Download PDF</button>
          </>
        }
      />

      <div className="px-8 py-8">
        {shareUrl && (
          <div className="mb-6 p-4 border border-white/10 rounded-md bg-[#0A0A0A] flex items-center gap-3">
            <span className="text-xs text-zinc-400">Client portal link</span>
            <code className="text-xs text-white truncate flex-1">{shareUrl}</code>
            <button onClick={()=>{navigator.clipboard?.writeText(shareUrl); toast.success("Copied");}} className="text-zinc-400 hover:text-white"><Copy size={14}/></button>
          </div>
        )}

        <div className="border border-white/10 bg-[#0A0A0A] rounded-md p-7 flex flex-wrap items-center gap-10">
          <ScoreRing value={a.overall_score} size={140} label="Overall score"/>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 flex-1 min-w-[280px]">
            {Object.entries(a.scores).map(([k, v]) => (
              <div key={k} className="border border-white/10 p-3 rounded">
                <div className="text-xs text-zinc-500 capitalize">{k}</div>
                <div className={"font-display text-2xl mt-1 " + (v >= 80 ? "text-[#00E599]" : v >= 55 ? "text-[#FFE629]" : "text-[#E5484D]")}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-4">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-[#E5484D]"/>
              <div className="text-sm font-medium">Issues detected</div>
            </div>
            <div className="space-y-3">
              {(a.issues || []).length === 0 && <div className="text-zinc-500 text-sm">No issues detected.</div>}
              {(a.issues || []).map((i, idx) => (
                <div key={idx} className="border border-white/10 p-4 rounded">
                  <div className="flex items-center justify-between gap-2">
                    <Badge>{i.category}</Badge>
                    <Badge color={i.severity === "high" ? "red" : i.severity === "medium" ? "yellow" : "gray"}>{i.severity}</Badge>
                  </div>
                  <div className="text-sm font-medium mt-3">{i.title}</div>
                  <div className="text-zinc-400 text-sm mt-1 leading-relaxed">{i.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={14} className="text-[#00E599]"/>
              <div className="text-sm font-medium">Recommendations</div>
            </div>
            <div className="space-y-3">
              {(a.recommendations || []).length === 0 && <div className="text-zinc-500 text-sm">No recommendations.</div>}
              {(a.recommendations || []).map((r, idx) => (
                <div key={idx} className="border border-white/10 p-4 rounded">
                  <Badge color={r.priority === "high" ? "red" : r.priority === "medium" ? "yellow" : "green"}>Priority · {r.priority}</Badge>
                  <div className="text-sm font-medium mt-3">{r.title}</div>
                  <div className="text-zinc-400 text-sm mt-1 leading-relaxed">{r.description}</div>
                  {r.impact && (
                    <div className="mt-2 text-xs text-[#00E599]">→ {r.impact}</div>
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
