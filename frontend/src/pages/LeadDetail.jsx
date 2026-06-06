import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-bits";
import { Activity, Send, UserPlus, Mail, Linkedin, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function LeadDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState("cold_email");
  const [angle, setAngle] = useState("");

  useEffect(() => {
    api.get(`/leads/${leadId}`).then(r => setLead(r.data));
  }, [leadId]);

  const runAudit = async () => {
    if (!lead) return;
    setBusy(true);
    try {
      const { data } = await api.post("/audits", { url: lead.website, lead_id: leadId });
      toast.success("Audit complete");
      navigate(`/audits/${data.audit_id}`);
    } finally { setBusy(false); }
  };

  const genOutreach = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/outreach/generate", { lead_id: leadId, type, angle });
      setDraft(data);
      toast.success("Draft ready");
    } catch {
      toast.error("Generation failed");
    } finally { setBusy(false); }
  };

  const addToCRM = async () => {
    if (!lead) return;
    try {
      await api.post("/crm/contacts", {
        name: lead.contact_name || lead.business_name,
        company: lead.business_name,
        email: lead.contact_email,
        website: lead.website,
        stage: "new_lead",
        value: 0,
        lead_id: lead.lead_id,
      });
      toast.success("Added to CRM");
    } catch {
      toast.error("Could not add");
    }
  };

  if (!lead) return <div className="p-10 font-mono text-sm text-zinc-500">loading…</div>;

  return (
    <div>
      <PageHeader
        overline={`/ lead · ${lead.industry}`}
        title={lead.business_name}
        subtitle={`${lead.location} · ${lead.employee_count} employees`}
        actions={
          <>
            <button onClick={addToCRM} className="btn-secondary inline-flex items-center gap-2"><UserPlus size={14}/> Add to CRM</button>
            <button onClick={runAudit} disabled={busy} className="btn-secondary inline-flex items-center gap-2"><Activity size={14}/> Run audit</button>
          </>
        }
      />
      <div className="px-10 py-8 grid lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
        {/* left meta */}
        <div className="bg-[#0A0A0A] p-6 space-y-5">
          <div>
            <div className="overline">website</div>
            <a href={lead.website} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 font-mono text-sm hover:underline">
              {lead.website} <ExternalLink size={12}/>
            </a>
          </div>
          <div>
            <div className="overline">tech stack</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {lead.tech_stack.map(t => <span key={t} className="font-mono text-[11px] uppercase tracking-[0.15em] border border-white/15 px-2 py-1">{t}</span>)}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10">
            <div className="bg-[#0A0A0A] p-4"><div className="overline">seo</div><div className="font-mono text-2xl mt-2">{lead.seo_score}</div></div>
            <div className="bg-[#0A0A0A] p-4"><div className="overline">site</div><div className="font-mono text-2xl mt-2">{lead.website_quality}</div></div>
            <div className="bg-[#0A0A0A] p-4"><div className="overline">opp</div><div className="font-mono text-2xl mt-2 text-[#00E599]">{lead.opportunity_score}</div></div>
          </div>
          <div>
            <div className="overline">contact</div>
            <div className="mt-2 text-sm">{lead.contact_name} <span className="text-zinc-500">· {lead.contact_title}</span></div>
            <div className="flex flex-wrap gap-3 mt-3 font-mono text-xs">
              {lead.contact_email && <a href={`mailto:${lead.contact_email}`} className="inline-flex items-center gap-1 text-zinc-300 hover:text-white"><Mail size={12}/> {lead.contact_email}</a>}
              {lead.linkedin && <a href={lead.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-zinc-300 hover:text-white"><Linkedin size={12}/> LinkedIn</a>}
            </div>
          </div>
        </div>

        {/* outreach generator */}
        <div className="bg-[#0A0A0A] p-6 lg:col-span-2">
          <div className="overline mb-4">/ ai outreach</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={type} onChange={e=>setType(e.target.value)}
              data-testid="outreach-type-select"
              className="bg-[#050505] border border-white/10 px-3 py-2.5 text-sm">
              <option value="cold_email">Cold email</option>
              <option value="linkedin">LinkedIn message</option>
              <option value="follow_up">Follow-up</option>
              <option value="proposal_intro">Proposal intro</option>
            </select>
            <input value={angle} onChange={e=>setAngle(e.target.value)}
              placeholder="Angle (e.g. SEO improvement)"
              className="bg-[#050505] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/40"/>
          </div>
          <button onClick={genOutreach} disabled={busy}
            data-testid="generate-outreach-btn"
            className="btn-primary mt-4 inline-flex items-center gap-2">
            <Send size={14}/> {busy ? "Generating…" : "Generate with Claude"}
          </button>

          {draft && (
            <div className="mt-6 border border-white/10 bg-[#050505] p-5">
              <div className="overline">/ draft</div>
              <div className="font-mono text-xs text-zinc-500 mt-3">subject</div>
              <div className="text-sm font-medium mt-1">{draft.subject}</div>
              <div className="font-mono text-xs text-zinc-500 mt-4">body</div>
              <pre className="whitespace-pre-wrap text-sm mt-1 leading-relaxed">{draft.body}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
