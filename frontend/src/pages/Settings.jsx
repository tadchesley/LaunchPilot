import React from "react";
import { useAuth } from "@/lib/auth.jsx";
import { PageHeader } from "@/components/ui-bits";

export default function Settings() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader overline="/ settings" title="Workspace" subtitle="Account, integrations, billing." />
      <div className="px-10 py-8 grid lg:grid-cols-2 gap-px bg-white/10 border border-white/10 max-w-4xl">
        <div className="bg-[#0A0A0A] p-6">
          <div className="overline mb-4">/ account</div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">name</span><span>{user?.name}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">email</span><span className="font-mono text-xs">{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">provider</span><span className="font-mono text-xs uppercase">{user?.auth_provider}</span></div>
          </div>
        </div>
        <div className="bg-[#0A0A0A] p-6">
          <div className="overline mb-4">/ integrations</div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border border-white/10 p-3">
              <span>Claude Sonnet 4.5 (LLM)</span><span className="font-mono text-[10px] text-[#00E599] uppercase">connected</span>
            </div>
            <div className="flex items-center justify-between border border-white/10 p-3">
              <span>Google OAuth</span><span className="font-mono text-[10px] text-[#00E599] uppercase">connected</span>
            </div>
            <div className="flex items-center justify-between border border-white/10 p-3 opacity-60">
              <span>SMTP / Gmail Send</span><span className="font-mono text-[10px] uppercase text-zinc-500">coming soon</span>
            </div>
            <div className="flex items-center justify-between border border-white/10 p-3 opacity-60">
              <span>Stripe Billing</span><span className="font-mono text-[10px] uppercase text-zinc-500">coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
