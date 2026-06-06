import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { PageHeader, Badge } from "@/components/ui-bits";
import { Search, Globe, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState({ industries: [], locations: [], sizes: [] });
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [location, setLocation] = useState("all");
  const [size, setSize] = useState("all");
  const [minOpp, setMinOpp] = useState(0);
  const [busy, setBusy] = useState(false);
  const csvRef = useRef(null);

  const load = async () => {
    const params = {};
    if (q) params.q = q;
    if (industry !== "all") params.industry = industry;
    if (location !== "all") params.location = location;
    if (size !== "all") params.size = size;
    if (minOpp > 0) params.min_opportunity = minOpp;
    const { data } = await api.get("/leads", { params });
    setLeads(data);
  };

  const findReal = async () => {
    if (industry === "all" || location === "all") {
      toast.error("Pick an industry and a location first");
      return;
    }
    setBusy(true);
    try {
      const params = { source: "real", industry, location };
      const { data } = await api.get("/leads", { params });
      if (!data.length) toast.error("No live results — try a bigger city");
      else { toast.success(`Found ${data.length} real businesses`); setLeads(data); }
    } catch {
      toast.error("Live lookup failed");
    } finally { setBusy(false); }
  };

  const importCsv = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await api.post("/leads/import", fd, { headers: { "Content-Type": "multipart/form-data" }});
      toast.success(`Imported ${data.inserted} leads`);
      await load();
    } catch {
      toast.error("Import failed");
    } finally { setBusy(false); }
  };

  useEffect(() => {
    api.get("/leads/filters").then(r => setFilters(r.data));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, industry, location, size, minOpp]);

  const oppColor = v => v >= 75 ? "text-[#00E599]" : v >= 50 ? "text-[#FFE629]" : "text-zinc-400";

  return (
    <div data-testid="leads-page">
      <PageHeader
        title="Leads"
        subtitle="Find businesses by industry and location. Use 'Find real businesses' to pull live results from OpenStreetMap."
        actions={
          <>
            <button onClick={()=>csvRef.current?.click()} className="btn-secondary inline-flex items-center gap-2">
              <Upload size={14}/> Import CSV
            </button>
            <input ref={csvRef} type="file" accept=".csv" className="hidden"
              onChange={e=>importCsv(e.target.files?.[0])} />
            <button onClick={findReal} disabled={busy} data-testid="find-real-btn"
              className="btn-primary inline-flex items-center gap-2">
              {busy ? <Loader2 size={14} className="animate-spin"/> : <Globe size={14}/>}
              Find real businesses
            </button>
          </>
        }
      />
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
          <div className="md:col-span-2 flex items-center gap-2 border border-white/10 px-3 bg-[#0A0A0A] rounded">
            <Search size={14} className="text-zinc-500"/>
            <input value={q} onChange={e=>setQ(e.target.value)}
              data-testid="leads-search-input"
              placeholder="Search business, industry, location…"
              className="bg-transparent py-2.5 text-sm outline-none w-full"/>
          </div>
          <select value={industry} onChange={e=>setIndustry(e.target.value)}
            data-testid="leads-industry-filter"
            className="bg-[#0A0A0A] border border-white/10 px-3 py-2.5 text-sm rounded">
            <option value="all">All industries</option>
            {filters.industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={location} onChange={e=>setLocation(e.target.value)}
            className="bg-[#0A0A0A] border border-white/10 px-3 py-2.5 text-sm rounded">
            <option value="all">All locations</option>
            {filters.locations.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={size} onChange={e=>setSize(e.target.value)}
            className="bg-[#0A0A0A] border border-white/10 px-3 py-2.5 text-sm rounded">
            <option value="all">Any size</option>
            {filters.sizes.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs text-zinc-400">Min opportunity</span>
          <input type="range" min={0} max={100} value={minOpp} onChange={e=>setMinOpp(Number(e.target.value))} className="w-40 accent-white" />
          <span className="text-sm text-[#00E599]">{minOpp}</span>
          <span className="ml-auto text-xs text-zinc-500">{leads.length} results</span>
        </div>

        <div className="border border-white/10 rounded-md overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500 bg-[#0A0A0A]">
            <div className="col-span-4">Business</div>
            <div className="col-span-2">Industry</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-1">SEO</div>
            <div className="col-span-2 text-right">Opportunity</div>
          </div>
          {leads.map(l => (
            <Link key={l.lead_id} to={`/leads/${l.lead_id}`}
              data-testid={`lead-row-${l.lead_id}`}
              className="grid grid-cols-12 px-5 py-4 border-b border-white/5 hover:bg-white/[0.03] items-center">
              <div className="col-span-4">
                <div className="flex items-center gap-2">
                  <div className="text-sm">{l.business_name}</div>
                  {l.source === "osm" && <Badge color="green">Live</Badge>}
                  {l.source === "csv" && <Badge>CSV</Badge>}
                </div>
                <div className="text-zinc-500 text-xs mt-0.5 truncate">{l.website}</div>
              </div>
              <div className="col-span-2 text-sm text-zinc-300">{l.industry}</div>
              <div className="col-span-3 text-sm text-zinc-400 truncate">{l.location}</div>
              <div className="col-span-1 text-sm">{l.seo_score}</div>
              <div className={"col-span-2 text-right font-display text-2xl tracking-tight " + oppColor(l.opportunity_score)}>
                {l.opportunity_score}
              </div>
            </Link>
          ))}
          {leads.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-zinc-500">No leads match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
