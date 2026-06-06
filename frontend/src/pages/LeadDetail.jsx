import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader, Badge } from "@/components/ui-bits";
import { Activity, Send, UserPlus, Mail, Linkedin, ExternalLink, Phone } from "lucide-react";
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
      toast.success("Added to pipeline");
    } catch {
      toast.error("Could not add");
    }
  };

  const copyDraft = () => {
    if (!draft) return;
    const text = `Subject: ${draft.subject}\n\n${draft.body}`;
    navigator.clipboard?.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!lead) return <div className="p-10 text-sm text-zinc-500">Loading…</div>;

  return (
    <div>
      <PageHeader
        title={lead.business_name}
        subtitle={`${lead.industry} · ${lead.location}`}
        actions={
          <>
            <button onClick={addToCRM} className="btn-secondary inline-flex items-center gap-2"><UserPlus size={14}/> Add to pipeline</button>
            <button onClick={runAudit} disabled={busy} className="btn-primary inline-flex items-center gap-2"><Activity size={14}/> Audit website</button>
          </>
        }
      />
      <div className="px-8 py-8 grid lg:grid-cols-3 gap-4">
        {/* left meta */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-5 space-y-5">
          <div>
            <div className="text-xs text-zinc-500">Website</div>
            <a href={lead.website} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-2 text-sm hover:underline">
              {lead.website} <ExternalLink size={12}/>
            </a>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-white/10 p-3 rounded"><div className="text-xs text-zinc-500">SEO</div><div className="text-2xl mt-1">{lead.seo_score}</div></div>
            <div className="border border-white/10 p-3 rounded"><div className="text-xs text-zinc-500">Site</div><div className="text-2xl mt-1">{lead.website_quality}</div></div>
            <div className="border border-white/10 p-3 rounded"><div className="text-xs text-zinc-500">Opportunity</div><div className="text-2xl mt-1 text-[#00E599]">{lead.opportunity_score}</div></div>
          </div>
          {lead.tech_stack?.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500">Tech stack</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {lead.tech_stack.map(t => <Badge key={t}>{t}</Badge>)}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-zinc-500">Contact</div>
            <div className="mt-2 text-sm">
              {lead.contact_name && <div>{lead.contact_name} <span className="text-zinc-500">· {lead.contact_title || "Owner"}</span></div>}
              <div className="flex flex-col gap-1.5 mt-2 text-xs">
                {lead.contact_email && <a href={`mailto:${lead.contact_email}`} className="text-zinc-300 hover:text-white inline-flex items-center gap-1.5"><Mail size={11}/> {lead.contact_email}</a>}
                {lead.phone && <span className="text-zinc-300 inline-flex items-center gap-1.5"><Phone size={11}/> {lead.phone}</span>}
                {lead.linkedin && <a href={lead.linkedin} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white inline-flex items-center gap-1.5"><Linkedin size={11}/> LinkedIn</a>}
              </div>
            </div>
          </div>
        </div>

        {/* outreach generator */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-5 lg:col-span-2">
          <div className="text-sm font-medium mb-3">AI outreach</div>
          <p className="text-xs text-zinc-500 mb-4">Generate a personalized message referencing this lead&apos;s actual website.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={type} onChange={e=>setType(e.target.value)}
              data-testid="outreach-type-select"
              className="bg-[#050505] border border-white/10 px-3 py-2.5 text-sm rounded">
              <option value="cold_email">Cold email</option>
              <option value="linkedin">LinkedIn message</option>
              <option value="follow_up">Follow-up</option>
              <option value="proposal_intro">Proposal intro</option>
            </select>
            <input value={angle} onChange={e=>setAngle(e.target.value)}
              placeholder="Angle (e.g. SEO improvement)"
              className="bg-[#050505] border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40"/>
          </div>
          <button onClick={genOutreach} disabled={busy}
            data-testid="generate-outreach-btn"
            className="btn-primary mt-4 inline-flex items-center gap-2">
            <Send size={14}/> {busy ? "Generating…" : "Generate with Claude"}
          </button>

          {draft && (
            <div className="mt-6 border border-white/10 bg-[#050505] rounded p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">Draft</div>
                <button onClick={copyDraft} className="text-xs text-zinc-400 hover:text-white">Copy</button>
              </div>
              <div className="text-xs text-zinc-500 mt-3">Subject</div>
              <div className="text-sm font-medium mt-1">{draft.subject}</div>
              <div className="text-xs text-zinc-500 mt-4">Body</div>
              <pre className="whitespace-pre-wrap text-sm mt-1 leading-relaxed font-sans">{draft.body}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
