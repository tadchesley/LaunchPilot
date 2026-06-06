import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-bits";
import { Plus, Mail, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const STAGE_LABEL = {
  new_lead: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};
const STAGE_ACCENT = {
  new_lead: "text-zinc-300",
  contacted: "text-[#FFE629]",
  qualified: "text-[#007AFF]",
  proposal: "text-[#FFE629]",
  negotiation: "text-[#FFE629]",
  won: "text-[#00E599]",
  lost: "text-[#E5484D]",
};

function ContactCard({ c, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, c.contact_id)}
      data-testid={`crm-card-${c.contact_id}`}
      className="border border-white/10 bg-[#050505] p-4 cursor-move hover:border-white/25 transition-colors">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{c.company}</div>
      <div className="text-sm mt-1">{c.name}</div>
      {c.email && (
        <div className="font-mono text-[11px] text-zinc-500 mt-2 flex items-center gap-1"><Mail size={10}/> {c.email}</div>
      )}
      {c.website && (
        <a href={c.website} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-zinc-400 mt-1 inline-flex items-center gap-1 hover:text-white">
          <ExternalLink size={10}/> visit
        </a>
      )}
      {c.value > 0 && (
        <div className="font-display text-xl mt-3 tracking-tighter text-[#00E599]">${c.value.toLocaleString()}</div>
      )}
    </div>
  );
}

export default function CRM() {
  const [stages, setStages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", website: "", value: 0, stage: "new_lead", notes: "" });

  const load = async () => {
    const { data } = await api.get("/crm/contacts");
    setStages(data.stages);
    setContacts(data.contacts);
  };
  useEffect(() => { load(); }, []);

  const onDragStart = (e, contactId) => {
    e.dataTransfer.setData("text/plain", contactId);
  };
  const onDrop = async (e, stage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setContacts(prev => prev.map(c => c.contact_id === id ? { ...c, stage } : c));
    try {
      await api.patch(`/crm/contacts/${id}/stage`, { stage });
    } catch {
      toast.error("Could not update");
      load();
    }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/crm/contacts", { ...form, value: Number(form.value) || 0 });
      setContacts(prev => [data, ...prev]);
      setOpen(false);
      setForm({ name: "", company: "", email: "", website: "", value: 0, stage: "new_lead", notes: "" });
      toast.success("Contact added");
    } catch {
      toast.error("Could not add");
    }
  };

  return (
    <div data-testid="crm-page">
      <PageHeader
        overline="/ crm"
        title="Pipeline"
        subtitle="Drag deals across stages. From new lead to won — tracked, timestamped, queryable."
        actions={
          <button onClick={()=>setOpen(true)} data-testid="new-contact-btn" className="btn-primary inline-flex items-center gap-2">
            <Plus size={14}/> Add contact
          </button>
        }
      />
      <div className="px-10 py-8">
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-4">
          {stages.map(s => {
            const items = contacts.filter(c => c.stage === s);
            const total = items.reduce((acc, c) => acc + (c.value || 0), 0);
            return (
              <div key={s}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>onDrop(e, s)}
                data-testid={`kanban-column-${s}`}
                className="min-w-[280px] w-72 flex-shrink-0 border border-white/10 bg-[#0A0A0A]">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className={"overline " + STAGE_ACCENT[s]}>{STAGE_LABEL[s]}</div>
                  <div className="font-mono text-[11px] text-zinc-500">{items.length}</div>
                </div>
                <div className="p-3 space-y-2 min-h-[200px]">
                  {items.map(c => <ContactCard key={c.contact_id} c={c} onDragStart={onDragStart} />)}
                  {items.length === 0 && (
                    <div className="border border-dashed border-white/10 p-6 text-center font-mono text-[11px] text-zinc-600">drop here</div>
                  )}
                </div>
                {total > 0 && (
                  <div className="px-4 py-2 border-t border-white/10 font-mono text-[11px] text-zinc-400 flex justify-between">
                    <span>total</span><span className="text-[#00E599]">${total.toLocaleString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4" onClick={()=>setOpen(false)}>
          <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 p-8" onClick={e=>e.stopPropagation()}>
            <div className="overline mb-3">/ new contact</div>
            <h2 className="font-display text-2xl tracking-tighter">Add to pipeline</h2>
            <form onSubmit={create} className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))}
                  data-testid="contact-name-input"
                  className="bg-transparent border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/40" placeholder="Name" />
                <input required value={form.company} onChange={e=>setForm(f=>({...f, company: e.target.value}))}
                  data-testid="contact-company-input"
                  className="bg-transparent border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/40" placeholder="Company" />
              </div>
              <input value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))}
                className="w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/40" placeholder="email@company.com" />
              <input value={form.website} onChange={e=>setForm(f=>({...f, website: e.target.value}))}
                className="w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/40" placeholder="https://company.com" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={form.value} onChange={e=>setForm(f=>({...f, value: e.target.value}))}
                  className="bg-transparent border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/40" placeholder="Deal value $" />
                <select value={form.stage} onChange={e=>setForm(f=>({...f, stage: e.target.value}))}
                  className="bg-[#050505] border border-white/10 px-3 py-2.5 text-sm">
                  {stages.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={()=>setOpen(false)}>Cancel</button>
                <button type="submit" data-testid="create-contact-submit" className="btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
