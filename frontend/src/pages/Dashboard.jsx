import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Stat } from "@/components/ui-bits";
import { Link } from "react-router-dom";
import { ArrowRight, Activity, Rocket, Send, Radar, Inbox } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [audits, setAudits] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/stats"),
      api.get("/projects"),
      api.get("/audits"),
    ]).then(([s, p, a]) => {
      setStats(s.data); setProjects(p.data); setAudits(a.data);
    }).catch(()=>{});
  }, []);

  return (
    <div data-testid="dashboard-page">
      <PageHeader title="Overview" subtitle="A summary of your projects, leads, and pipeline." />

      <div className="px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Projects" value={stats?.projects ?? "—"} hint="Active deployments" />
          <Stat label="Audits run" value={stats?.audits_completed ?? "—"} hint="All time" />
          <Stat label="Leads" value={stats?.leads_available ?? "—"} hint="Available in your pool" />
          <Stat label="Deals won" value={stats?.deals_won ?? 0} hint={`$${(stats?.won_value ?? 0).toLocaleString()} closed`} accent="green" />
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-4">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Rocket size={14}/><span className="text-sm font-medium">Recent projects</span>
              </div>
              <Link to="/projects" className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1">View all <ArrowRight size={11}/></Link>
            </div>
            <div className="divide-y divide-white/5">
              {projects.length === 0 && <div className="p-5 text-sm text-zinc-500">No projects yet. Deploy your first site to get started.</div>}
              {projects.slice(0, 5).map(p => (
                <Link key={p.project_id} to={`/projects/${p.project_id}`} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.03]">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{p.name}</div>
                    <div className="text-zinc-500 text-xs mt-0.5 truncate">{p.live_url}</div>
                  </div>
                  <div className="text-[10px] text-[#00E599] uppercase tracking-wide">{p.status}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Activity size={14}/><span className="text-sm font-medium">Recent audits</span>
              </div>
              <Link to="/audits" className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1">View all <ArrowRight size={11}/></Link>
            </div>
            <div className="divide-y divide-white/5">
              {audits.length === 0 && <div className="p-5 text-sm text-zinc-500">No audits yet. Run your first one on a lead or project.</div>}
              {audits.slice(0, 5).map(a => (
                <Link key={a.audit_id} to={`/audits/${a.audit_id}`} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.03]">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{a.url}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="font-display text-xl tracking-tight">{a.overall_score}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <QuickCard to="/leads" Icon={Radar} title="Find leads" body="Search businesses by industry & location."/>
          <QuickCard to="/outreach" Icon={Send} title="Send outreach" body="Launch a campaign in under a minute."/>
          <QuickCard to="/crm" Icon={Inbox} title="Manage pipeline" body="Track deals from new lead to closed."/>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ to, Icon, title, body }) {
  return (
    <Link to={to} className="bg-[#0A0A0A] border border-white/10 rounded-md p-5 hover:bg-white/[0.03] hover:border-white/20 transition-colors group">
      <Icon size={18}/>
      <div className="font-display text-lg mt-3">{title}</div>
      <div className="text-zinc-500 text-sm mt-1">{body}</div>
      <div className="mt-3 text-xs text-zinc-400 group-hover:text-white inline-flex items-center gap-1">Open <ArrowRight size={11}/></div>
    </Link>
  );
}
