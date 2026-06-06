import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth.jsx";
import { Toaster } from "sonner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AuthCallback from "@/pages/AuthCallback";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Deployments from "@/pages/Deployments";
import ProjectDetail from "@/pages/ProjectDetail";
import Audits from "@/pages/Audits";
import AuditDetail from "@/pages/AuditDetail";
import Leads from "@/pages/Leads";
import LeadDetail from "@/pages/LeadDetail";
import Outreach from "@/pages/Outreach";
import CRM from "@/pages/CRM";
import Settings from "@/pages/Settings";
import PublicAuditPortal from "@/pages/PublicAuditPortal";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white font-mono text-sm">
        loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  // CRITICAL: Process Emergent OAuth callback synchronously during render
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/portal/audit/:token" element={<PublicAuditPortal />} />
      <Route element={<Protected><DashboardLayout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Deployments />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/audits" element={<Audits />} />
        <Route path="/audits/:auditId" element={<AuditDetail />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:leadId" element={<LeadDetail />} />
        <Route path="/outreach" element={<Outreach />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster theme="dark" position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
