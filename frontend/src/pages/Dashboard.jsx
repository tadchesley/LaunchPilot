import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Stat } from "@/components/ui-bits";
import { Link } from "react-router-dom";
import { ArrowUpRight, Activity, Rocket, Send, Radar, Inbox } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [audits, setAudits] = useState([]);

  useEffect(() => {
    (async () => {
      const [s, p, a] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/projects"),
        api.get("/audits"),
      ]);
      setStats(s.data); setProjects(p.data); setAudits(a.data);
    })().catch(()=>{});
  }, []);

  return (
    <div data-testid="dashboard-page">
      <PageHeader
        overline="/ overview"
        title="Command center"
        subtitle="Everything you ship, every lead you touch, every deal you close — at a glance."
      />

      <div className="px-10 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10">
          <Stat label="leads available" value={stats?.leads_available ?? "—"} hint="/ in pool" />
          <Stat label="audits completed" value={stats?.audits_completed ?? "—"} hint="/ all time" />
          <Stat label="deployments" value={stats?.projects ?? "—"} hint="/ active projects" />
          <Stat label="deals won" value={stats?.deals_won ?? "—"} hint={`/ $${(stats?.won_value ?? 0).toLocaleString()}`} accent="green" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 mt-px">
          <Stat label="emails sent" value={stats?.emails_sent ?? "—"} hint="/ outreach" />
          <Stat label="open rate" value={`${stats?.open_rate ?? 0}%`} hint="/ engagement" accent="yellow" />
          <Stat label="reply rate" value={`${stats?.reply_rate ?? 0}%`} hint="/ engagement" accent="green" />
          <Stat label="meetings booked" value={stats?.meetings_booked ?? 0} hint="/ pipeline" />
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {/* Recent deployments */}
          <div className="bg-[#0A0A0A] p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Rocket size={14}/>
                <div className="overline">/ recent deployments</div>
              </div>
              <Link to="/projects" className="font-mono text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1">view all <ArrowUpRight size={12}/></Link>
            </div>
            <div className="divide-y divide-white/5">
              {projects.length === 0 && <div className="text-sm text-zinc-500 py-6 font-mono">no deployments yet — create your first project.</div>}
              {projects.slice(0, 5).map(p => (
                <Link key={p.project_id} to={`/projects/${p.project_id}`} className="flex items-center justify-between py-3 hover:bg-white/5 px-2 -mx-2">
                  <div>
                    <div className="text-sm">{p.name}</div>
                    <div className="font-mono text-[11px] text-zinc-500">{p.live_url}</div>
                  </div>
                  <div className="font-mono text-[10px] text-[#00E599] uppercase">{p.status}</div>
                </Link>
              ))}
            </div>
          </div>
          {/* Recent audits */}
          <div className="bg-[#0A0A0A] p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity size={14}/>
                <div className="overline">/ recent audits</div>
              </div>
              <Link to="/audits" className="font-mono text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1">view all <ArrowUpRight size={12}/></Link>
            </div>
            <div className="divide-y divide-white/5">
              {audits.length === 0 && <div className="text-sm text-zinc-500 py-6 font-mono">no audits yet — run your first one from a lead or project.</div>}
              {audits.slice(0, 5).map(a => (
                <Link key={a.audit_id} to={`/audits/${a.audit_id}`} className="flex items-center justify-between py-3 hover:bg-white/5 px-2 -mx-2">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{a.url}</div>
                    <div className="font-mono text-[11px] text-zinc-500">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                  <div className="font-mono text-2xl tracking-tighter">{a.overall_score}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-px bg-white/10 border border-white/10">
          <Link to="/leads" className="bg-[#0A0A0A] p-6 hover:bg-white/5 transition-colors group">
            <Radar size={18}/>
            <div className="font-display text-xl mt-3">Find new leads</div>
            <div className="text-zinc-500 text-sm mt-2">Search the pool by industry, geography and opportunity score.</div>
            <div className="mt-4 font-mono text-xs text-zinc-400 group-hover:text-white inline-flex items-center gap-1">open finder <ArrowUpRight size={12}/></div>
          </Link>
          <Link to="/outreach" className="bg-[#0A0A0A] p-6 hover:bg-white/5 transition-colors group">
            <Send size={18}/>
            <div className="font-display text-xl mt-3">Launch a campaign</div>
            <div className="text-zinc-500 text-sm mt-2">Spin up a personalized outreach sequence in under 60 seconds.</div>
            <div className="mt-4 font-mono text-xs text-zinc-400 group-hover:text-white inline-flex items-center gap-1">open outreach <ArrowUpRight size={12}/></div>
          </Link>
          <Link to="/crm" className="bg-[#0A0A0A] p-6 hover:bg-white/5 transition-colors group">
            <Inbox size={18}/>
            <div className="font-display text-xl mt-3">Move deals forward</div>
            <div className="text-zinc-500 text-sm mt-2">Update pipeline stages, schedule follow-ups, close clients.</div>
            <div className="mt-4 font-mono text-xs text-zinc-400 group-hover:text-white inline-flex items-center gap-1">open crm <ArrowUpRight size={12}/></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
