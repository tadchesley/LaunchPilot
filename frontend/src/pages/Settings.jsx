import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth.jsx";
import { api, API_URL } from "@/lib/api";
import { PageHeader, Badge } from "@/components/ui-bits";
import { Upload, Palette } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [brand, setBrand] = useState({ brand_name: "", brand_color: "#000000", logo_url: null });
  const [busy, setBusy] = useState(false);
  const logoRef = useRef(null);

  useEffect(() => {
    api.get("/brand").then(r => setBrand({
      brand_name: r.data.brand_name || "",
      brand_color: r.data.brand_color || "#000000",
      logo_url: r.data.logo_url,
    }));
  }, []);

  const saveBrand = async () => {
    setBusy(true);
    try {
      await api.post("/brand", { brand_name: brand.brand_name, brand_color: brand.brand_color });
      toast.success("Brand saved");
    } finally { setBusy(false); }
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await api.post("/uploads/logo", fd, { headers: { "Content-Type": "multipart/form-data" }});
      setBrand(b => ({ ...b, logo_url: data.logo_url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally { setBusy(false); }
  };

  const logoSrc = brand.logo_url ? (brand.logo_url.startsWith("http") ? brand.logo_url : `${API_URL.replace(/\/api$/, "")}${brand.logo_url}`) : null;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account, branding, and integrations." />
      <div className="px-8 py-8 max-w-4xl space-y-6">
        <section className="bg-[#0A0A0A] border border-white/10 rounded-md p-6">
          <div className="text-sm font-medium mb-4">Account</div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Name</span><span>{user?.name}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Email</span><span>{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Sign-in method</span><Badge>{user?.auth_provider}</Badge></div>
          </div>
        </section>

        <section className="bg-[#0A0A0A] border border-white/10 rounded-md p-6">
          <div className="flex items-center gap-2 mb-2"><Palette size={16}/><div className="text-sm font-medium">White-label branding</div></div>
          <p className="text-xs text-zinc-500 mb-5">Used on shared audit reports and PDF exports for your clients.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400">Brand name</label>
              <input value={brand.brand_name} onChange={e=>setBrand(b=>({...b, brand_name: e.target.value}))}
                placeholder="My Agency"
                className="mt-1.5 w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm rounded outline-none focus:border-white/40" />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Brand color</label>
              <div className="mt-1.5 flex items-center gap-2">
                <input type="color" value={brand.brand_color}
                  onChange={e=>setBrand(b=>({...b, brand_color: e.target.value}))}
                  className="w-12 h-10 bg-transparent border border-white/10 rounded cursor-pointer" />
                <input value={brand.brand_color}
                  onChange={e=>setBrand(b=>({...b, brand_color: e.target.value}))}
                  className="flex-1 bg-transparent border border-white/10 px-3 py-2 text-sm rounded font-mono" />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="text-xs text-zinc-400">Logo</label>
            <div className="mt-1.5 flex items-center gap-4">
              <div className="w-20 h-20 border border-white/10 rounded flex items-center justify-center bg-[#050505]">
                {logoSrc ? (
                  <img src={logoSrc} alt="logo" className="max-w-full max-h-full"/>
                ) : (
                  <span className="text-xs text-zinc-500">No logo</span>
                )}
              </div>
              <button onClick={()=>logoRef.current?.click()} className="btn-secondary inline-flex items-center gap-2">
                <Upload size={14}/> Upload logo
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={e=>uploadLogo(e.target.files?.[0])} />
            </div>
          </div>

          <div className="mt-6">
            <button onClick={saveBrand} disabled={busy} className="btn-primary">Save branding</button>
          </div>
        </section>

        <section className="bg-[#0A0A0A] border border-white/10 rounded-md p-6">
          <div className="text-sm font-medium mb-4">Integrations</div>
          <div className="space-y-2 text-sm">
            <Row title="Claude Sonnet 4.5 (AI)" status="connected"/>
            <Row title="Google OAuth" status="connected"/>
            <Row title="Object storage" status="connected"/>
            <Row title="Uptime monitoring" status="connected"/>
            <Row title="Real-time lead source (OpenStreetMap)" status="connected"/>
            <Row title="Email sending (SMTP)" status="coming"/>
            <Row title="Stripe billing" status="coming"/>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ title, status }) {
  return (
    <div className="flex items-center justify-between border border-white/10 p-3 rounded">
      <span>{title}</span>
      <Badge color={status === "connected" ? "green" : "gray"}>{status === "connected" ? "Connected" : "Coming soon"}</Badge>
    </div>
  );
}
