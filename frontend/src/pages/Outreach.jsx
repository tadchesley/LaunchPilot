import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Send, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function Outreach() {
  const [camps, setCamps] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", target_industry: "" });

  const load = async () => {
    const [c, d] = await Promise.all([api.get("/campaigns"), api.get("/outreach/drafts")]);
    setCamps(c.data); setDrafts(d.data);
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/campaigns", form);
      setCamps(prev => [data, ...prev]);
      setOpen(false);
      setForm({ name: "", description: "", target_industry: "" });
      toast.success("Campaign created");
    } catch {
      toast.error("Could not create");
    }
  };

  return (
    <div data-testid="outreach-page">
      <PageHeader
        title="Outreach"
        subtitle="Group your messages into campaigns and track results."
        actions={
          <button onClick={()=>setOpen(true)} data-testid="new-campaign-btn" className="btn-primary inline-flex items-center gap-2">
            <Plus size={14}/> New campaign
          </button>
        }
      />
      <div className="px-8 py-8">
        <div className="text-sm font-medium mb-3">Campaigns</div>
        {camps.length === 0 ? (
          <EmptyState icon={Send} title="No campaigns yet" description="Create a campaign to organize your outreach efforts." />
        ) : (
          <div className="border border-white/10 rounded-md overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500 bg-[#0A0A0A]">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Industry</div>
              <div className="col-span-1">Sent</div>
              <div className="col-span-1">Open</div>
              <div className="col-span-1">Reply</div>
              <div className="col-span-1">Meet</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {camps.map(c => (
              <div key={c.campaign_id} className="grid grid-cols-12 px-5 py-4 border-b border-white/5 items-center">
                <div className="col-span-4">
                  <div className="text-sm">{c.name}</div>
                  <div className="text-zinc-500 text-xs mt-0.5 truncate">{c.description}</div>
                </div>
                <div className="col-span-2 text-sm text-zinc-300">{c.target_industry || "—"}</div>
                <div className="col-span-1">{c.sent}</div>
                <div className="col-span-1 text-[#FFE629]">{c.opened}</div>
                <div className="col-span-1 text-[#00E599]">{c.replied}</div>
                <div className="col-span-1">{c.meetings_booked}</div>
                <div className="col-span-2 text-right text-xs uppercase tracking-wide text-zinc-400">{c.status}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-sm font-medium mb-3">Recent AI drafts</div>
        {drafts.length === 0 ? (
          <div className="text-sm text-zinc-500 border border-white/10 rounded-md p-6">No drafts yet. Generate one from a lead's page.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {drafts.slice(0, 8).map(d => (
              <div key={d.draft_id} className="bg-[#0A0A0A] border border-white/10 rounded p-5">
                <div className="text-xs uppercase tracking-wide text-zinc-500">{d.type.replace("_", " ")}</div>
                <div className="text-sm font-medium mt-2">{d.subject}</div>
                <div className="text-zinc-400 text-sm mt-2 line-clamp-3 leading-relaxed">{d.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4" onClick={()=>setOpen(false)}>
          <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-md p-7" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl tracking-tight">New campaign</h2>
              <button onClick={()=>setOpen(false)} className="text-zinc-500 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={create} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400">Campaign name</label>
                <input required value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))}
                  data-testid="campaign-name-input"
                  className="mt-1.5 w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Target industry (optional)</label>
                <input value={form.target_industry} onChange={e=>setForm(f=>({...f, target_industry: e.target.value}))}
                  className="mt-1.5 w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" placeholder="Dental, Real Estate, …" />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Description (optional)</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} rows={3}
                  className="mt-1.5 w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40 resize-none" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={()=>setOpen(false)}>Cancel</button>
                <button type="submit" data-testid="create-campaign-submit" className="btn-primary inline-flex items-center gap-2">
                  <Send size={14}/> Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
