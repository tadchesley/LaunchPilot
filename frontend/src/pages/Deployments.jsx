import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, StatusDot } from "@/components/ui-bits";
import { Link } from "react-router-dom";
import { Plus, Rocket, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

function NewProjectDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/projects", { name, source_url: url || null, description: desc || null });
      toast.success("Project deployed");
      onCreated(data); onClose();
      setName(""); setUrl(""); setDesc("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not deploy");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 p-8" onClick={e=>e.stopPropagation()}>
        <div className="overline mb-3">/ new project</div>
        <h2 className="font-display text-2xl tracking-tighter">Deploy a site</h2>
        <p className="text-zinc-500 text-sm mt-2">Provide a name and optional source URL. We generate a live URL instantly.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="overline">project name</label>
            <input required value={name} onChange={e=>setName(e.target.value)}
              data-testid="project-name-input"
              className="mt-2 w-full bg-transparent border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/40" placeholder="acme-marketing-site" />
          </div>
          <div>
            <label className="overline">source url (optional)</label>
            <input value={url} onChange={e=>setUrl(e.target.value)}
              data-testid="project-source-url"
              className="mt-2 w-full bg-transparent border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/40" placeholder="https://github.com/acme/site or https://example.com" />
          </div>
          <div>
            <label className="overline">description</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3}
              className="mt-2 w-full bg-transparent border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/40 resize-none" placeholder="What is this project?" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={busy} data-testid="create-project-submit"
              className="btn-primary inline-flex items-center gap-2">
              <Rocket size={14}/> {busy ? "Deploying…" : "Deploy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Deployments() {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await api.get("/projects");
    setProjects(data);
  };
  useEffect(() => { load(); }, []);

  return (
    <div data-testid="deployments-page">
      <PageHeader
        overline="/ deployments"
        title="Projects"
        subtitle="Every site you've shipped. Production, staging, and preview environments — with rollback history."
        actions={
          <button onClick={()=>setOpen(true)} data-testid="new-project-btn" className="btn-primary inline-flex items-center gap-2">
            <Plus size={14}/> New project
          </button>
        }
      />
      <div className="px-10 py-8">
        {projects.length === 0 ? (
          <div className="border border-dashed border-white/15 p-16 text-center">
            <Rocket className="mx-auto mb-4" size={28}/>
            <div className="font-display text-2xl tracking-tighter">No projects yet</div>
            <div className="text-zinc-500 mt-2">Deploy your first site to get started.</div>
            <button onClick={()=>setOpen(true)} className="btn-primary mt-6 inline-flex items-center gap-2">
              <Plus size={14}/> Deploy a site
            </button>
          </div>
        ) : (
          <div className="border border-white/10">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 bg-[#0A0A0A]">
              <div className="col-span-4">project</div>
              <div className="col-span-3">live url</div>
              <div className="col-span-2">environment</div>
              <div className="col-span-2">last deploy</div>
              <div className="col-span-1 text-right">status</div>
            </div>
            <div>
              {projects.map(p => (
                <Link key={p.project_id} to={`/projects/${p.project_id}`}
                  data-testid={`project-row-${p.project_id}`}
                  className="grid grid-cols-12 px-5 py-4 border-b border-white/5 hover:bg-white/[0.03] items-center">
                  <div className="col-span-4">
                    <div className="text-sm">{p.name}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{p.description || "—"}</div>
                  </div>
                  <div className="col-span-3 font-mono text-xs text-zinc-300 truncate">{p.live_url}</div>
                  <div className="col-span-2 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">{p.environment}</div>
                  <div className="col-span-2 font-mono text-xs text-zinc-500">{new Date(p.last_deployed_at).toLocaleString()}</div>
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <StatusDot status={p.status}/>
                    <span className="font-mono text-[10px] text-zinc-400 uppercase">{p.status}</span>
                    <ArrowUpRight size={12} className="text-zinc-500 ml-1"/>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <NewProjectDialog open={open} onClose={()=>setOpen(false)} onCreated={(p)=>setProjects(prev=>{
        if (prev.some(x => x.project_id === p.project_id)) return prev;
        return [p, ...prev];
      })} />
    </div>
  );
}
