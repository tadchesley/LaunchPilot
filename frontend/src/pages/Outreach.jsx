import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-bits";
import { Send, Plus } from "lucide-react";
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
      toast.success("Campaign launched");
    } catch {
      toast.error("Could not create");
    }
  };

  return (
    <div data-testid="outreach-page">
      <PageHeader
        overline="/ outreach"
        title="Campaigns"
        subtitle="Personalized email sequences. Track sends, opens, replies and booked meetings."
        actions={
          <button onClick={()=>setOpen(true)} data-testid="new-campaign-btn" className="btn-primary inline-flex items-center gap-2">
            <Plus size={14}/> New campaign
          </button>
        }
      />
      <div className="px-10 py-8">
        <div className="border border-white/10">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 bg-[#0A0A0A]">
            <div className="col-span-4">name</div>
            <div className="col-span-2">industry</div>
            <div className="col-span-1">sent</div>
            <div className="col-span-1">open</div>
            <div className="col-span-1">reply</div>
            <div className="col-span-1">meet</div>
            <div className="col-span-2 text-right">status</div>
          </div>
          {camps.length === 0 && <div className="px-5 py-10 text-zinc-500 text-sm font-mono">no campaigns yet</div>}
          {camps.map(c => (
            <div key={c.campaign_id} className="grid grid-cols-12 px-5 py-4 border-b border-white/5 items-center">
              <div className="col-span-4">
                <div className="text-sm">{c.name}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{c.description}</div>
              </div>
              <div className="col-span-2 text-sm text-zinc-300">{c.target_industry || "—"}</div>
              <div className="col-span-1 font-mono">{c.sent}</div>
              <div className="col-span-1 font-mono text-[#FFE629]">{c.opened}</div>
              <div className="col-span-1 font-mono text-[#00E599]">{c.replied}</div>
              <div className="col-span-1 font-mono">{c.meetings_booked}</div>
              <div className="col-span-2 text-right font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">{c.status}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 overline mb-4">/ recent ai drafts</div>
        <div className="grid md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {drafts.length === 0 && <div className="bg-[#0A0A0A] p-6 text-zinc-500 text-sm font-mono">no drafts yet — generate one from a lead.</div>}
          {drafts.slice(0, 8).map(d => (
            <div key={d.draft_id} className="bg-[#0A0A0A] p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{d.type.replace("_", " ")}</div>
              <div className="text-sm font-medium mt-2">{d.subject}</div>
              <div className="text-zinc-400 text-sm mt-2 line-clamp-3 leading-relaxed">{d.body}</div>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4" onClick={()=>setOpen(false)}>
          <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 p-8" onClick={e=>e.stopPropagation()}>
            <div className="overline mb-3">/ new campaign</div>
            <h2 className="font-display text-2xl tracking-tighter">Launch a campaign</h2>
            <form onSubmit={create} className="mt-6 space-y-4">
              <div>
                <label className="overline">campaign name</label>
                <input required value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))}
                  data-testid="campaign-name-input"
                  className="mt-2 w-full bg-transparent border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/40" />
              </div>
              <div>
                <label className="overline">target industry</label>
                <input value={form.target_industry} onChange={e=>setForm(f=>({...f, target_industry: e.target.value}))}
                  className="mt-2 w-full bg-transparent border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/40" placeholder="Dental, Real Estate, …" />
              </div>
              <div>
                <label className="overline">description</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} rows={3}
                  className="mt-2 w-full bg-transparent border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/40 resize-none" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={()=>setOpen(false)}>Cancel</button>
                <button type="submit" data-testid="create-campaign-submit" className="btn-primary inline-flex items-center gap-2">
                  <Send size={14}/> Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
