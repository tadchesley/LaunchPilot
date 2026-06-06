import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-bits";
import { Plus, Mail, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

const STAGE_LABEL = {
  new_lead: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};
const STAGE_DOT = {
  new_lead: "bg-zinc-500",
  contacted: "bg-[#FFE629]",
  qualified: "bg-[#007AFF]",
  proposal: "bg-[#FFE629]",
  negotiation: "bg-[#FFE629]",
  won: "bg-[#00E599]",
  lost: "bg-[#E5484D]",
};

function ContactCard({ c, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, c.contact_id)}
      data-testid={`crm-card-${c.contact_id}`}
      className="border border-white/10 bg-[#050505] p-3 rounded cursor-move hover:border-white/25 transition-colors">
      <div className="text-xs text-zinc-500">{c.company}</div>
      <div className="text-sm mt-0.5 font-medium">{c.name}</div>
      {c.email && (
        <div className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1 truncate"><Mail size={10}/> <span className="truncate">{c.email}</span></div>
      )}
      {c.website && (
        <a href={c.website} target="_blank" rel="noreferrer" className="text-[11px] text-zinc-400 mt-1 inline-flex items-center gap-1 hover:text-white">
          <ExternalLink size={10}/> visit
        </a>
      )}
      {c.value > 0 && (
        <div className="font-display text-lg mt-2 tracking-tight text-[#00E599]">${c.value.toLocaleString()}</div>
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
        title="Pipeline"
        subtitle="Drag cards between stages to move deals forward."
        actions={
          <button onClick={()=>setOpen(true)} data-testid="new-contact-btn" className="btn-primary inline-flex items-center gap-2">
            <Plus size={14}/> Add contact
          </button>
        }
      />
      <div className="px-8 py-8">
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-4">
          {stages.map(s => {
            const items = contacts.filter(c => c.stage === s);
            const total = items.reduce((acc, c) => acc + (c.value || 0), 0);
            return (
              <div key={s}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>onDrop(e, s)}
                data-testid={`kanban-column-${s}`}
                className="min-w-[260px] w-64 flex-shrink-0 border border-white/10 bg-[#0A0A0A] rounded-md flex flex-col">
                <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={"w-1.5 h-1.5 rounded-full " + STAGE_DOT[s]}/>
                    <div className="text-sm font-medium">{STAGE_LABEL[s]}</div>
                  </div>
                  <div className="text-xs text-zinc-500">{items.length}</div>
                </div>
                <div className="p-2 space-y-2 min-h-[200px] flex-1">
                  {items.map(c => <ContactCard key={c.contact_id} c={c} onDragStart={onDragStart} />)}
                  {items.length === 0 && (
                    <div className="border border-dashed border-white/10 p-5 text-center text-[11px] text-zinc-600 rounded">drop here</div>
                  )}
                </div>
                {total > 0 && (
                  <div className="px-3 py-2 border-t border-white/10 text-xs text-zinc-400 flex justify-between">
                    <span>Total</span><span className="text-[#00E599]">${total.toLocaleString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4" onClick={()=>setOpen(false)}>
          <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-md p-7" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl tracking-tight">Add contact</h2>
              <button onClick={()=>setOpen(false)} className="text-zinc-500 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))}
                  data-testid="contact-name-input"
                  className="bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" placeholder="Name" />
                <input required value={form.company} onChange={e=>setForm(f=>({...f, company: e.target.value}))}
                  data-testid="contact-company-input"
                  className="bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" placeholder="Company" />
              </div>
              <input value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))}
                className="w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" placeholder="email@company.com" />
              <input value={form.website} onChange={e=>setForm(f=>({...f, website: e.target.value}))}
                className="w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" placeholder="https://company.com" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={form.value} onChange={e=>setForm(f=>({...f, value: e.target.value}))}
                  className="bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" placeholder="Deal value $" />
                <select value={form.stage} onChange={e=>setForm(f=>({...f, stage: e.target.value}))}
                  className="bg-[#050505] border border-white/10 px-3 py-2.5 text-sm rounded">
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
