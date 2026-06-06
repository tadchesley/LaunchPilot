import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import {
  LayoutDashboard, Rocket, Activity, Radar, Send, Inbox, Settings,
  LogOut, Search, CommandIcon
} from "lucide-react";
import { TEST_IDS } from "@/constants/testIds";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, key: "overview" },
  { to: "/projects", label: "Deployments", icon: Rocket, key: "deployments" },
  { to: "/audits", label: "AI Audits", icon: Activity, key: "audits" },
  { to: "/leads", label: "Lead Finder", icon: Radar, key: "leads" },
  { to: "/outreach", label: "Outreach", icon: Send, key: "outreach" },
  { to: "/crm", label: "CRM", icon: Inbox, key: "crm" },
  { to: "/settings", label: "Settings", icon: Settings, key: "settings" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside data-testid={TEST_IDS.nav.sidebar} className="w-64 shrink-0 border-r border-white/10 bg-[#0A0A0A] flex flex-col">
        <Link to="/dashboard" className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-display font-bold text-sm">L</div>
          <span className="font-display text-lg tracking-tight">launchpilot</span>
        </Link>

        <div className="px-3 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 border border-white/10 bg-[#050505] font-mono text-xs text-zinc-500">
            <Search size={12}/>
            <span className="flex-1">Search…</span>
            <span className="flex items-center gap-1 text-zinc-600"><CommandIcon size={10}/>K</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => (
            <NavLink
              key={item.key}
              to={item.to}
              data-testid={`nav-${item.key}`}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors " +
                (isActive
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white")
              }>
              <item.icon size={15} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-white/10 flex items-center justify-center font-mono text-xs">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{user?.name}</div>
              <div className="font-mono text-[10px] text-zinc-500 truncate">{user?.email}</div>
            </div>
            <button
              onClick={onLogout}
              data-testid={TEST_IDS.nav.logout}
              className="text-zinc-500 hover:text-white" title="Sign out">
              <LogOut size={14}/>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
