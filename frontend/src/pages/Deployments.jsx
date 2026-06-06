import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, StatusDot, Badge, EmptyState } from "@/components/ui-bits";
import { Link } from "react-router-dom";
import { Plus, Rocket, ArrowRight, Upload, X } from "lucide-react";
import { toast } from "sonner";

function NewProjectDialog({ open, onClose, onCreated }) {
  const [tab, setTab] = useState("zip"); // "zip" | "url"
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "zip") {
        if (!file) { toast.error("Please choose a .zip file"); setBusy(false); return; }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("name", name);
        fd.append("description", desc || "");
        const { data } = await api.post("/projects/upload", fd, { headers: { "Content-Type": "multipart/form-data" }});
        toast.success(`Deployed ${data.files} files`);
        // refresh list via parent
        onCreated();
      } else {
        const { data } = await api.post("/projects", { name, source_url: url || null, description: desc || null });
        toast.success("Project created");
        onCreated(data);
      }
      onClose();
      setName(""); setUrl(""); setDesc(""); setFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Deployment failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-md p-7" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl tracking-tight">New project</h2>
            <p className="text-zinc-500 text-sm mt-1">Deploy a website. We give you a live URL.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>

        <div className="flex gap-1 mb-5 p-1 bg-[#050505] border border-white/10 rounded-md w-fit">
          <button onClick={() => setTab("zip")} type="button"
            className={"px-3 py-1.5 text-xs rounded " + (tab === "zip" ? "bg-white text-black" : "text-zinc-400")}>
            Upload ZIP
          </button>
          <button onClick={() => setTab("url")} type="button"
            className={"px-3 py-1.5 text-xs rounded " + (tab === "url" ? "bg-white text-black" : "text-zinc-400")}>
            From URL
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400">Project name</label>
            <input required value={name} onChange={e=>setName(e.target.value)}
              data-testid="project-name-input"
              className="mt-1.5 w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" placeholder="My awesome site" />
          </div>

          {tab === "zip" ? (
            <div>
              <label className="text-xs text-zinc-400">Website ZIP (max 25 MB)</label>
              <div
                onClick={()=>fileRef.current?.click()}
                className="mt-1.5 border border-dashed border-white/15 rounded p-6 text-center cursor-pointer hover:border-white/30">
                <Upload size={20} className="mx-auto text-zinc-500 mb-2"/>
                <div className="text-sm">{file ? file.name : "Click to choose a .zip"}</div>
                <div className="text-xs text-zinc-500 mt-1">HTML, CSS, JS, images</div>
                <input ref={fileRef} type="file" accept=".zip" className="hidden"
                  data-testid="project-zip-input"
                  onChange={e=>setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-zinc-400">Source URL (optional)</label>
              <input value={url} onChange={e=>setUrl(e.target.value)}
                data-testid="project-source-url"
                className="mt-1.5 w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" placeholder="https://github.com/user/repo or https://example.com" />
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-400">Description (optional)</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2}
              className="mt-1.5 w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40 resize-none" placeholder="What is this project?" />
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
        title="Projects"
        subtitle="Sites you've deployed. Upload a ZIP and we give you a live URL."
        actions={
          <button onClick={()=>setOpen(true)} data-testid="new-project-btn" className="btn-primary inline-flex items-center gap-2">
            <Plus size={14}/> New project
          </button>
        }
      />
      <div className="px-8 py-8">
        {projects.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No projects yet"
            description="Upload a website ZIP file and we'll give you a live URL in seconds."
            action={
              <button onClick={()=>setOpen(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus size={14}/> Deploy a site
              </button>
            }
          />
        ) : (
          <div className="border border-white/10 rounded-md overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500 bg-[#0A0A0A]">
              <div className="col-span-4">Project</div>
              <div className="col-span-3">Live URL</div>
              <div className="col-span-2">Uptime</div>
              <div className="col-span-2">Last deployed</div>
              <div className="col-span-1 text-right">Status</div>
            </div>
            <div>
              {projects.map(p => (
                <Link key={p.project_id} to={`/projects/${p.project_id}`}
                  data-testid={`project-row-${p.project_id}`}
                  className="grid grid-cols-12 px-5 py-4 border-b border-white/5 hover:bg-white/[0.03] items-center">
                  <div className="col-span-4">
                    <div className="text-sm">{p.name}</div>
                    <div className="text-zinc-500 text-xs mt-0.5 truncate">{p.description || "—"}</div>
                  </div>
                  <div className="col-span-3 text-xs text-zinc-300 truncate">{p.live_url}</div>
                  <div className="col-span-2">
                    {p.last_uptime_status ? (
                      <Badge color={p.last_uptime_status === "up" ? "green" : p.last_uptime_status === "down" ? "red" : "gray"}>
                        {p.last_uptime_status}
                      </Badge>
                    ) : <span className="text-xs text-zinc-500">—</span>}
                  </div>
                  <div className="col-span-2 text-xs text-zinc-400">{new Date(p.last_deployed_at).toLocaleDateString()}</div>
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <StatusDot status={p.status}/>
                    <ArrowRight size={12} className="text-zinc-500"/>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <NewProjectDialog open={open} onClose={()=>setOpen(false)} onCreated={(p)=>{
        if (p && p.project_id) {
          setProjects(prev => prev.some(x => x.project_id === p.project_id) ? prev : [p, ...prev]);
        } else {
          load();
        }
      }} />
    </div>
  );
}
