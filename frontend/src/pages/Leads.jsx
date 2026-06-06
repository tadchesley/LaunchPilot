import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui-bits";
import { Search } from "lucide-react";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState({ industries: [], locations: [], sizes: [] });
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [location, setLocation] = useState("all");
  const [size, setSize] = useState("all");
  const [minOpp, setMinOpp] = useState(0);

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
        overline="/ lead finder"
        title="Surface businesses that need help"
        subtitle="Search by industry, location, and size. Sort by opportunity score to call the right ones first."
      />
      <div className="px-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          <div className="md:col-span-2 flex items-center gap-2 border border-white/10 px-3 bg-[#0A0A0A]">
            <Search size={14} className="text-zinc-500"/>
            <input value={q} onChange={e=>setQ(e.target.value)}
              data-testid="leads-search-input"
              placeholder="Search business name, industry, location…"
              className="bg-transparent py-2.5 text-sm outline-none w-full"/>
          </div>
          <select value={industry} onChange={e=>setIndustry(e.target.value)}
            data-testid="leads-industry-filter"
            className="bg-[#0A0A0A] border border-white/10 px-3 py-2.5 text-sm">
            <option value="all">All industries</option>
            {filters.industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={location} onChange={e=>setLocation(e.target.value)}
            className="bg-[#0A0A0A] border border-white/10 px-3 py-2.5 text-sm">
            <option value="all">All locations</option>
            {filters.locations.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={size} onChange={e=>setSize(e.target.value)}
            className="bg-[#0A0A0A] border border-white/10 px-3 py-2.5 text-sm">
            <option value="all">Any size</option>
            {filters.sizes.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="overline">min opportunity</span>
          <input type="range" min={0} max={100} value={minOpp} onChange={e=>setMinOpp(Number(e.target.value))} className="w-40 accent-white" />
          <span className="font-mono text-sm text-[#00E599]">{minOpp}</span>
          <span className="ml-auto font-mono text-xs text-zinc-500">{leads.length} results</span>
        </div>

        <div className="border border-white/10">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 bg-[#0A0A0A]">
            <div className="col-span-4">business</div>
            <div className="col-span-2">industry</div>
            <div className="col-span-2">location</div>
            <div className="col-span-1">seo</div>
            <div className="col-span-1">site</div>
            <div className="col-span-2 text-right">opportunity</div>
          </div>
          {leads.map(l => (
            <Link key={l.lead_id} to={`/leads/${l.lead_id}`}
              data-testid={`lead-row-${l.lead_id}`}
              className="grid grid-cols-12 px-5 py-4 border-b border-white/5 hover:bg-white/[0.03] items-center">
              <div className="col-span-4">
                <div className="text-sm">{l.business_name}</div>
                <div className="font-mono text-[11px] text-zinc-500 mt-0.5 truncate">{l.website}</div>
              </div>
              <div className="col-span-2 text-sm text-zinc-300">{l.industry}</div>
              <div className="col-span-2 text-sm text-zinc-400">{l.location}</div>
              <div className="col-span-1 font-mono text-sm">{l.seo_score}</div>
              <div className="col-span-1 font-mono text-sm">{l.website_quality}</div>
              <div className={"col-span-2 text-right font-display text-2xl tracking-tighter " + oppColor(l.opportunity_score)}>
                {l.opportunity_score}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
