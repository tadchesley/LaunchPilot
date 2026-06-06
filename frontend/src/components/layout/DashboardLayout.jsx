import React, { useEffect, useState, useCallback } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import { api } from "@/lib/api";
import {
  LayoutDashboard, Rocket, Activity, Radar, Send, Inbox, Settings,
  LogOut, Bell, Palette
} from "lucide-react";
import { TEST_IDS } from "@/constants/testIds";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, key: "overview" },
  { to: "/projects", label: "Projects", icon: Rocket, key: "deployments" },
  { to: "/audits", label: "Audits", icon: Activity, key: "audits" },
  { to: "/leads", label: "Leads", icon: Radar, key: "leads" },
  { to: "/outreach", label: "Outreach", icon: Send, key: "outreach" },
  { to: "/crm", label: "Pipeline", icon: Inbox, key: "crm" },
];

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unread: 0 });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications");
      setData(data);
    } catch {/* ignore */}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const markAll = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} data-testid="notifications-bell"
        className="relative p-2 hover:bg-white/5 rounded-md text-zinc-300 hover:text-white transition-colors">
        <Bell size={16}/>
        {data.unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#E5484D] rounded-full" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}/>
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto border border-white/10 bg-[#0A0A0A] z-40 shadow-2xl">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="text-sm font-medium">Notifications</div>
              {data.unread > 0 && (
                <button onClick={markAll} className="text-xs text-zinc-400 hover:text-white">Mark all read</button>
              )}
            </div>
            {data.notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-zinc-500 text-sm">No notifications yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {data.notifications.map(n => (
                  <div key={n.notification_id} className={"px-4 py-3 " + (n.read ? "opacity-60" : "")}>
                    <div className="flex items-start gap-2">
                      <span className={"w-1.5 h-1.5 rounded-full mt-1.5 " + (n.severity === "high" ? "bg-[#E5484D]" : "bg-[#00E599]")}/>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">{n.title}</div>
                        <div className="text-zinc-500 text-xs mt-0.5">{n.body}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside data-testid={TEST_IDS.nav.sidebar} className="w-60 shrink-0 border-r border-white/10 bg-[#0A0A0A] flex flex-col">
        <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-display font-bold text-sm">L</div>
          <span className="font-display text-lg tracking-tight">LaunchPilot</span>
        </Link>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <NavLink key={item.key} to={item.to} data-testid={`nav-${item.key}`}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors " +
                (isActive ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white")
              }>
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div className="border-t border-white/10 my-3"/>
          <NavLink to="/settings" data-testid="nav-settings"
            className={({ isActive }) =>
              "flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors " +
              (isActive ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white")
            }>
            <Settings size={16}/> <span>Settings</span>
          </NavLink>
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{user?.name}</div>
              <div className="text-[11px] text-zinc-500 truncate">{user?.email}</div>
            </div>
            <button onClick={onLogout} data-testid={TEST_IDS.nav.logout}
              className="text-zinc-500 hover:text-white transition-colors" title="Sign out">
              <LogOut size={14}/>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        <header className="h-14 border-b border-white/10 flex items-center justify-end px-6 gap-2 bg-[#080808]">
          <NotificationsBell />
        </header>
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
