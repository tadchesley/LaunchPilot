import React from "react";
import { Link } from "react-router-dom";
import {
  Rocket, Globe, Radar, Send, Inbox, Sparkles, ChevronRight,
  ArrowUpRight, CheckCircle2, Activity, Bot
} from "lucide-react";
import { TEST_IDS } from "@/constants/testIds";

const HERO_BG = "https://images.unsplash.com/photo-1638864616275-9f0b291a2eb6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHw0fHxhYnN0cmFjdCUyMGRhcmslMjBnZW9tZXRyaWMlMjB0ZXh0dXJlfGVufDB8fHx8MTc4MDc2MTA0OHww&ixlib=rb-4.1.0&q=85";
const FEATURE_BG = "https://images.unsplash.com/photo-1660914256311-918659fae88f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGRhcmslMjBnZW9tZXRyaWMlMjB0ZXh0dXJlfGVufDB8fHx8MTc4MDc2MTA0OHww&ixlib=rb-4.1.0&q=85";
const OFFICE_BG = "https://images.pexels.com/photos/10344210/pexels-photo-10344210.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const AVATAR_1 = "https://images.unsplash.com/photo-1506863530036-1efeddceb993?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbCUyMHlvdW5nfGVufDB8fHx8MTc4MDc2MTA2MHww&ixlib=rb-4.1.0&q=85";
const AVATAR_2 = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbCUyMHlvdW5nfGVufDB8fHx8MTc4MDc2MTA2MHww&ixlib=rb-4.1.0&q=85";

function NavBar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-display font-bold text-sm">L</div>
          <span className="font-display text-lg tracking-tight">launchpilot</span>
          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">/ ops</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-[0.18em]">
          <a href="#platform" className="text-zinc-400 hover:text-white transition-colors">Platform</a>
          <a href="#features" className="text-zinc-400 hover:text-white transition-colors">Modules</a>
          <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</a>
          <a href="#playbook" className="text-zinc-400 hover:text-white transition-colors">Playbook</a>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" data-testid={TEST_IDS.landing.login} className="btn-secondary text-sm">Sign in</Link>
          <Link to="/signup" data-testid={TEST_IDS.landing.getStarted} className="btn-primary text-sm inline-flex items-center gap-1">
            Get started <ChevronRight size={14}/>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0">
        <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-[#050505]" />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-8 pt-24 pb-32">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-400 mb-6 flex items-center gap-3">
          <span className="inline-block w-1.5 h-1.5 bg-[#00E599] animate-pulse" />
          AI agency OS — v1.0 live
        </div>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[88px] leading-[0.95] tracking-tighter max-w-4xl">
          Find clients. Audit sites. <br/>
          <span className="text-zinc-500">Deploy. Close.</span>
        </h1>
        <p className="mt-8 max-w-xl text-zinc-400 text-lg leading-relaxed">
          A single command center for web agencies — lead discovery, AI audits, redesign proposals,
          outreach automation, deployments, and CRM. Everything you need to run an agency, nothing you don&apos;t.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2">
            Start free <ArrowUpRight size={16}/>
          </Link>
          <Link to="/login" className="btn-secondary">Open dashboard</Link>
          <div className="ml-2 font-mono text-xs text-zinc-500">no credit card · 14-day pro trial</div>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 max-w-3xl">
          {[
            { k: "leads/mo", v: "12.4K" },
            { k: "audits run", v: "38K" },
            { k: "sites deployed", v: "92K" },
            { k: "avg reply rate", v: "11.8%" },
          ].map((s) => (
            <div key={s.k} className="bg-[#050505] p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{s.k}</div>
              <div className="font-display text-3xl mt-2">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Bento() {
  return (
    <section id="features" className="relative border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-8 py-28">
        <div className="overline mb-6">/ modules</div>
        <h2 className="font-display text-4xl sm:text-5xl tracking-tighter max-w-3xl">
          Six modules. One operating system. Built to compound.
        </h2>

        <div className="mt-16 grid grid-cols-12 gap-4">
          {/* Big card — Lead Finder */}
          <div className="col-span-12 lg:col-span-7 border border-white/10 bg-[#0A0A0A] p-8 relative overflow-hidden min-h-[360px]">
            <div className="absolute inset-0 opacity-30">
              <img src={FEATURE_BG} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/60 to-transparent" />
            </div>
            <div className="relative">
              <Radar size={22} />
              <div className="overline mt-6">01 / lead finder</div>
              <h3 className="font-display text-3xl mt-3 tracking-tight">Surface businesses that need help — at scale</h3>
              <p className="text-zinc-400 mt-4 max-w-md leading-relaxed">
                Filter by industry, geography, tech stack and live site quality. Every lead arrives with an
                AI-generated opportunity score so you know who to call first.
              </p>
              <div className="mt-8 inline-flex font-mono text-xs items-center gap-3 border border-white/10 px-3 py-2">
                <span className="text-zinc-500">opportunity_score</span>
                <span className="text-[#00E599]">94</span>
                <span className="text-zinc-700">|</span>
                <span className="text-zinc-500">seo</span>
                <span className="text-[#FFE629]">41</span>
              </div>
            </div>
          </div>

          {/* AI Audit */}
          <div className="col-span-12 lg:col-span-5 border border-white/10 bg-[#0A0A0A] p-8 min-h-[360px] relative">
            <Activity size={22} />
            <div className="overline mt-6">02 / ai audit</div>
            <h3 className="font-display text-2xl mt-3 tracking-tight">Six dimensions of website intelligence</h3>
            <div className="mt-8 grid grid-cols-3 gap-px bg-white/10 border border-white/10 font-mono text-xs">
              {[
                ["SEO", 72, "yellow"], ["PERF", 41, "red"], ["A11Y", 88, "green"],
                ["MOBILE", 91, "green"], ["CONV", 53, "yellow"], ["SEC", 96, "green"],
              ].map(([l, v, c]) => (
                <div key={l} className="bg-[#0A0A0A] p-3">
                  <div className="text-zinc-500 text-[10px]">{l}</div>
                  <div className={"text-xl mt-1 " + (c === "green" ? "text-[#00E599]" : c === "yellow" ? "text-[#FFE629]" : "text-[#E5484D]")}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Outreach */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 border border-white/10 bg-[#0A0A0A] p-8 min-h-[280px]">
            <Send size={22}/>
            <div className="overline mt-6">03 / outreach</div>
            <h3 className="font-display text-2xl mt-3 tracking-tight">Personalized, never spray-and-pray</h3>
            <p className="text-zinc-400 mt-3 text-sm leading-relaxed">
              Claude-powered cold emails referencing each prospect&apos;s actual website issues.
            </p>
          </div>

          {/* Deployments */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 border border-white/10 bg-[#0A0A0A] p-8 min-h-[280px]">
            <Rocket size={22}/>
            <div className="overline mt-6">04 / deployments</div>
            <h3 className="font-display text-2xl mt-3 tracking-tight">Ship sites in seconds</h3>
            <p className="text-zinc-400 mt-3 text-sm leading-relaxed">
              Push HTML, ZIPs or imported URLs. Production, staging, preview — with rollback history.
            </p>
          </div>

          {/* CRM */}
          <div className="col-span-12 md:col-span-12 lg:col-span-4 border border-white/10 bg-[#0A0A0A] p-8 min-h-[280px]">
            <Inbox size={22}/>
            <div className="overline mt-6">05 / crm pipeline</div>
            <h3 className="font-display text-2xl mt-3 tracking-tight">Kanban built for closing</h3>
            <p className="text-zinc-400 mt-3 text-sm leading-relaxed">
              From new lead to won deal — tracked, timestamped, queryable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Find", d: "Search across 50M+ business records by industry, geo, tech stack." },
    { n: "02", t: "Audit", d: "Run a six-dimension AI website audit and generate a client-ready report." },
    { n: "03", t: "Outreach", d: "Generate hyper-personalized emails. Launch campaigns. Track replies." },
    { n: "04", t: "Close", d: "Move deals through the pipeline. Send proposals. Win." },
    { n: "05", t: "Deploy", d: "Ship the redesign. Monitor uptime. Bill the retainer." },
  ];
  return (
    <section id="playbook" className="relative border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-8 py-28">
        <div className="overline mb-6">/ playbook</div>
        <h2 className="font-display text-4xl sm:text-5xl tracking-tighter max-w-2xl">
          The five-step revenue loop, automated.
        </h2>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-5 gap-px bg-white/10 border border-white/10">
          {steps.map((s) => (
            <div key={s.n} className="bg-[#050505] p-7">
              <div className="font-mono text-xs text-zinc-500">{s.n}</div>
              <div className="font-display text-2xl mt-3">{s.t}</div>
              <div className="text-zinc-400 text-sm mt-3 leading-relaxed">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Solo", price: "$0", desc: "For freelancers exploring the platform", features: ["3 projects", "50 lead lookups / mo", "10 AI audits", "Community support"] },
    { name: "Studio", price: "$49", desc: "For independent operators winning clients", features: ["Unlimited projects", "1,500 lead lookups / mo", "Unlimited audits", "Outreach campaigns", "CRM pipeline"], featured: true },
    { name: "Agency", price: "$149", desc: "For growing teams running engagements", features: ["Team workspaces", "White-label reports", "10,000 leads / mo", "Priority support", "API access"] },
  ];
  return (
    <section id="pricing" className="relative border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-8 py-28">
        <div className="overline mb-6">/ pricing</div>
        <h2 className="font-display text-4xl sm:text-5xl tracking-tighter max-w-2xl">
          Flat pricing. No usage roulette.
        </h2>
        <div className="mt-14 grid md:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {plans.map(p => (
            <div key={p.name} className={"p-8 bg-[#050505] " + (p.featured ? "relative" : "")}>
              {p.featured && (
                <div className="absolute -top-3 left-8 bg-[#00E599] text-black font-mono text-[10px] tracking-[0.2em] px-2 py-1">
                  RECOMMENDED
                </div>
              )}
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{p.name}</div>
              <div className="font-display text-5xl mt-5 tracking-tighter">{p.price}<span className="text-zinc-500 text-base font-mono ml-2">/mo</span></div>
              <div className="text-zinc-400 mt-3 text-sm">{p.desc}</div>
              <ul className="mt-6 space-y-3">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 size={14} className="text-[#00E599] shrink-0"/> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={"mt-8 block text-center " + (p.featured ? "btn-primary" : "btn-secondary")}>
                {p.featured ? "Start now" : "Choose plan"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="relative border-b border-white/10 overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img src={OFFICE_BG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/70 to-transparent" />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-8 py-28">
        <div className="overline mb-6">/ operators</div>
        <h2 className="font-display text-4xl sm:text-5xl tracking-tighter max-w-3xl">
          Built by agency operators who got tired of stitching together 9 tools.
        </h2>
        <div className="mt-14 grid md:grid-cols-2 gap-px bg-white/10 border border-white/10 max-w-4xl">
          {[
            { name: "Sarah Chen", role: "Founder · Northpulse Studio", img: AVATAR_1, q: "We replaced Apollo, Instantly, HubSpot, and our deploy pipeline. Cut overhead by 70%." },
            { name: "Marcus Patel", role: "Solo · Vertex Marketing", img: AVATAR_2, q: "The AI audits alone convert at 3x our old discovery calls. Clients see the gap." },
          ].map(t => (
            <div key={t.name} className="bg-[#050505] p-8">
              <p className="font-display text-2xl tracking-tight leading-snug">&ldquo;{t.q}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <img src={t.img} className="w-10 h-10 object-cover grayscale" alt="" />
                <div>
                  <div className="text-sm">{t.name}</div>
                  <div className="font-mono text-xs text-zinc-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-8 py-32">
        <div className="border border-white/10 bg-[#0A0A0A] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-[#00E599] opacity-[0.06] rounded-full blur-3xl" />
          <div className="relative">
            <Bot size={28}/>
            <h2 className="font-display text-4xl sm:text-6xl tracking-tighter mt-6 max-w-3xl">
              Stop juggling tabs. <br/> Start running an OS.
            </h2>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/signup" className="btn-primary inline-flex items-center gap-2">
                Launch your workspace <ArrowUpRight size={16}/>
              </Link>
              <Link to="/login" className="btn-secondary">I have an account</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#050505]">
      <div className="max-w-[1400px] mx-auto px-8 py-12 flex flex-wrap items-center justify-between gap-6 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white text-black flex items-center justify-center font-display font-bold text-xs">L</div>
          <span className="font-mono text-xs text-zinc-500">© {new Date().getFullYear()} launchpilot — agency OS</span>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Security</a>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <main className="bg-[#050505] text-white min-h-screen">
      <NavBar />
      <Hero />
      <Bento />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
