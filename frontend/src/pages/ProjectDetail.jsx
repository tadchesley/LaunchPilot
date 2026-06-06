import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader, StatusDot, Badge } from "@/components/ui-bits";
import { Rocket, Trash2, ExternalLink, Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [uptime, setUptime] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [proj, mon] = await Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/monitoring/${projectId}`),
    ]);
    setData(proj.data);
    setUptime(mon.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [projectId]);

  const deploy = async () => {
    setBusy(true);
    try {
      await api.post(`/projects/${projectId}/deploy`);
      toast.success("Redeployed");
      await load();
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm("Delete this project?")) return;
    await api.delete(`/projects/${projectId}`);
    toast.success("Project removed");
    navigate("/projects");
  };

  const runAudit = async () => {
    if (!data?.project) return;
    setBusy(true);
    try {
      const url = data.project.source_url || data.project.live_url;
      const { data: a } = await api.post("/audits", { url, project_id: projectId });
      toast.success("Audit complete");
      navigate(`/audits/${a.audit_id}`);
    } catch {
      toast.error("Audit failed");
    } finally { setBusy(false); }
  };

  const checkNow = async () => {
    setBusy(true);
    try {
      await api.post(`/monitoring/${projectId}/check`);
      await load();
      toast.success("Status updated");
    } finally { setBusy(false); }
  };

  if (!data) return <div className="p-10 text-sm text-zinc-500">Loading…</div>;
  const { project, deployments } = data;
  const liveUrl = project.live_url?.startsWith("/api/") ? `${window.location.origin}${project.live_url}` : project.live_url;

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={project.description || "—"}
        actions={
          <>
            <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-2"><ExternalLink size={14}/> Visit site</a>
            <button onClick={runAudit} disabled={busy} className="btn-secondary inline-flex items-center gap-2"><Activity size={14}/> Audit</button>
            <button onClick={deploy} disabled={busy} className="btn-primary inline-flex items-center gap-2"><Rocket size={14}/> Redeploy</button>
            <button onClick={remove} className="btn-secondary inline-flex items-center gap-2 text-[#E5484D] hover:text-[#E5484D]" title="Delete"><Trash2 size={14}/></button>
          </>
        }
      />
      <div className="px-8 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-md md:col-span-2">
            <div className="text-xs text-zinc-500">Live URL</div>
            <a href={liveUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm break-all hover:underline">{liveUrl}</a>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-md">
            <div className="text-xs text-zinc-500">Deployments</div>
            <div className="font-display text-3xl mt-2 tracking-tight">{project.deployments_count}</div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500">Uptime (24h)</div>
              <button onClick={checkNow} className="text-zinc-500 hover:text-white" title="Check now"><RefreshCw size={12}/></button>
            </div>
            <div className="font-display text-3xl mt-2 tracking-tight">{uptime?.summary?.uptime_pct ?? "—"}%</div>
            <div className="mt-2"><Badge color={uptime?.summary?.last_status === "up" ? "green" : uptime?.summary?.last_status === "down" ? "red" : "gray"}>{uptime?.summary?.last_status || "unknown"}</Badge></div>
          </div>
        </div>

        <div className="mb-4 text-sm font-medium">Deployment history</div>
        <div className="border border-white/10 rounded-md overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500 bg-[#0A0A0A]">
            <div className="col-span-5">Deployment</div>
            <div className="col-span-3">Message</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {deployments.map(d => (
            <div key={d.deployment_id} className="grid grid-cols-12 px-5 py-3 border-b border-white/5 items-center">
              <div className="col-span-5 text-xs">
                <div className="font-mono text-zinc-300">{d.deployment_id}</div>
                <div className="text-zinc-500 mt-0.5">{new Date(d.created_at).toLocaleString()}</div>
              </div>
              <div className="col-span-3 text-xs text-zinc-400 truncate">{d.commit_message || "—"}</div>
              <div className="col-span-2 text-xs text-zinc-300">{d.duration_seconds}s</div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <StatusDot status={d.status}/>
                <span className="text-[10px] uppercase tracking-wide text-zinc-400">{d.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
