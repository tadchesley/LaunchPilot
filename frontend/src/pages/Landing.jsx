import React from "react";
import { Link } from "react-router-dom";
import {
  Rocket, Globe, Radar, Send, Inbox, ArrowRight,
  CheckCircle2, Activity, BarChart3, Shield, Sparkles
} from "lucide-react";
import { TEST_IDS } from "@/constants/testIds";

function NavBar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-display font-bold text-sm">L</div>
          <span className="font-display text-lg tracking-tight">LaunchPilot</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" data-testid={TEST_IDS.landing.login} className="text-sm text-zinc-300 hover:text-white px-3 py-2">Sign in</Link>
          <Link to="/signup" data-testid={TEST_IDS.landing.getStarted} className="btn-primary text-sm inline-flex items-center gap-1.5">
            Get started <ArrowRight size={14}/>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505]" />
      <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/15 rounded-full text-xs text-zinc-300 mb-8">
          <span className="w-1.5 h-1.5 bg-[#00E599] rounded-full animate-pulse"/>
          The all-in-one platform for web agencies
        </div>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
          Find clients. Build sites. <br/>
          <span className="text-zinc-500">Grow your agency.</span>
        </h1>
        <p className="mt-8 text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Discover businesses that need websites, audit them with AI, generate outreach,
          deploy sites, and track every deal — all in one place.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2 px-5 py-3">
            Start for free <ArrowRight size={16}/>
          </Link>
          <Link to="/login" className="btn-secondary px-5 py-3">I have an account</Link>
        </div>
        <p className="mt-4 text-xs text-zinc-500">No credit card required.</p>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Radar, t: "Find leads", d: "Search real businesses by industry & location. See which sites need help most." },
    { icon: Activity, t: "Audit websites", d: "Instant AI audits with SEO, speed, mobile, and conversion scores." },
    { icon: Send, t: "Generate outreach", d: "Personalized emails written by Claude — referencing each lead's actual issues." },
    { icon: Rocket, t: "Deploy sites", d: "Upload a ZIP, get a live URL in seconds. Production, staging & rollback." },
    { icon: Inbox, t: "Track deals", d: "Drag-and-drop CRM pipeline from new lead to closed-won." },
    { icon: Shield, t: "Monitor uptime", d: "Automatic checks every 5 minutes with in-app alerts when sites go down." },
  ];
  return (
    <section id="features" className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">Everything you need, in one place.</h2>
          <p className="mt-4 text-zinc-400 text-lg">Stop juggling 9 different tools. LaunchPilot replaces your lead-gen, CRM, deployments, and audit tools.</p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {items.map(({ icon: Icon, t, d }) => (
            <div key={t} className="bg-[#0A0A0A] p-7">
              <Icon size={22} className="text-white"/>
              <div className="font-display text-xl mt-4">{t}</div>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", t: "Find a business", d: "Filter by industry and location. We pull from OpenStreetMap so the leads are real." },
    { n: "2", t: "Run an AI audit", d: "Get a six-dimension website score and AI-written recommendations in 10 seconds." },
    { n: "3", t: "Send personalized outreach", d: "Claude writes a cold email referencing the actual issues found on their site." },
    { n: "4", t: "Track & close", d: "Move deals through the pipeline. Deploy the redesign when they say yes." },
  ];
  return (
    <section id="how" className="border-b border-white/10 bg-[#080808]">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">How it works.</h2>
          <p className="mt-4 text-zinc-400 text-lg">From first prospect to first deal — in four simple steps.</p>
        </div>
        <div className="mt-14 grid md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {steps.map(s => (
            <div key={s.n} className="bg-[#0A0A0A] p-8">
              <div className="font-display text-3xl text-zinc-600">0{s.n}</div>
              <div className="font-display text-2xl mt-3">{s.t}</div>
              <p className="text-zinc-400 mt-3 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Free", price: "$0", desc: "Everything you need to get started.", features: ["Unlimited projects", "Unlimited AI audits", "Lead finder", "CRM pipeline", "Outreach generation", "Uptime monitoring", "PDF reports"] },
  ];
  return (
    <section id="pricing" className="border-b border-white/10">
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-4xl sm:text-5xl tracking-tight">Free while in beta.</h2>
        <p className="mt-4 text-zinc-400 text-lg">All features unlocked. We&apos;ll let you know before pricing changes.</p>
        <div className="mt-12 max-w-md mx-auto border border-white/15 bg-[#0A0A0A] p-8 text-left">
          <div className="text-sm text-zinc-400">{plans[0].name}</div>
          <div className="font-display text-6xl mt-2 tracking-tight">{plans[0].price}<span className="text-zinc-500 text-base ml-2">/month</span></div>
          <p className="text-zinc-400 mt-3">{plans[0].desc}</p>
          <ul className="mt-6 space-y-3">
            {plans[0].features.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={14} className="text-[#00E599] shrink-0"/> {f}
              </li>
            ))}
          </ul>
          <Link to="/signup" className="mt-8 block text-center btn-primary py-3">Get started for free</Link>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-b border-white/10">
      <div className="max-w-4xl mx-auto px-6 py-28 text-center">
        <Sparkles size={28} className="mx-auto text-white mb-6"/>
        <h2 className="font-display text-4xl sm:text-5xl tracking-tight">Ready to grow your agency?</h2>
        <p className="mt-4 text-zinc-400 text-lg">Create your workspace in 30 seconds.</p>
        <Link to="/signup" className="mt-10 inline-flex items-center gap-2 btn-primary px-6 py-3">
          Start for free <ArrowRight size={16}/>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white text-black flex items-center justify-center font-display font-bold text-xs">L</div>
          <span>© {new Date().getFullYear()} LaunchPilot</span>
        </div>
        <div className="flex items-center gap-6">
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
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
