import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader, StatusDot } from "@/components/ui-bits";
import { Rocket, Trash2, ExternalLink, Activity } from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await api.get(`/projects/${projectId}`);
    setData(data);
  };
  useEffect(() => { load(); }, [projectId]);

  const deploy = async () => {
    setBusy(true);
    try {
      await api.post(`/projects/${projectId}/deploy`);
      toast.success("Redeployed");
      await load();
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm("Delete this project and its deployments?")) return;
    await api.delete(`/projects/${projectId}`);
    toast.success("Project removed");
    navigate("/projects");
  };

  const runAudit = async () => {
    if (!data?.project) return;
    setBusy(true);
    try {
      const { data: a } = await api.post("/audits", { url: data.project.live_url, project_id: projectId });
      toast.success("Audit complete");
      navigate(`/audits/${a.audit_id}`);
    } catch {
      toast.error("Audit failed");
    } finally { setBusy(false); }
  };

  if (!data) return <div className="p-10 font-mono text-sm text-zinc-500">loading…</div>;
  const { project, deployments } = data;

  return (
    <div>
      <PageHeader
        overline={`/ project · ${project.environment}`}
        title={project.name}
        subtitle={project.description || "—"}
        actions={
          <>
            <a href={project.live_url} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-2"><ExternalLink size={14}/> Visit</a>
            <button onClick={runAudit} disabled={busy} className="btn-secondary inline-flex items-center gap-2"><Activity size={14}/> Run audit</button>
            <button onClick={deploy} disabled={busy} className="btn-primary inline-flex items-center gap-2"><Rocket size={14}/> Redeploy</button>
            <button onClick={remove} className="btn-secondary inline-flex items-center gap-2 text-[#E5484D] hover:text-[#E5484D]"><Trash2 size={14}/></button>
          </>
        }
      />
      <div className="px-10 py-8">
        <div className="grid md:grid-cols-3 gap-px bg-white/10 border border-white/10 mb-10">
          <div className="bg-[#0A0A0A] p-6">
            <div className="overline">live url</div>
            <div className="font-mono text-sm mt-3 break-all">{project.live_url}</div>
          </div>
          <div className="bg-[#0A0A0A] p-6">
            <div className="overline">deployments</div>
            <div className="font-display text-4xl mt-3 tracking-tighter">{project.deployments_count}</div>
          </div>
          <div className="bg-[#0A0A0A] p-6">
            <div className="overline">framework</div>
            <div className="font-mono text-sm mt-3 uppercase tracking-[0.15em]">{project.framework}</div>
          </div>
        </div>

        <div className="overline mb-4">/ deployment history</div>
        <div className="border border-white/10">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 bg-[#0A0A0A]">
            <div className="col-span-4">deployment</div>
            <div className="col-span-3">environment</div>
            <div className="col-span-3">duration</div>
            <div className="col-span-2 text-right">status</div>
          </div>
          {deployments.map(d => (
            <div key={d.deployment_id} className="grid grid-cols-12 px-5 py-3 border-b border-white/5 items-center">
              <div className="col-span-4 font-mono text-xs">{d.deployment_id}<div className="text-zinc-500 mt-0.5">{new Date(d.created_at).toLocaleString()}</div></div>
              <div className="col-span-3 font-mono text-xs text-zinc-400 uppercase">{d.environment}</div>
              <div className="col-span-3 font-mono text-xs text-zinc-300">{d.duration_seconds}s</div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <StatusDot status={d.status}/>
                <span className="font-mono text-[10px] uppercase text-zinc-400">{d.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
