import React from "react";

export function PageHeader({ overline, title, subtitle, actions }) {
  return (
    <div className="px-10 py-8 border-b border-white/10 flex items-end justify-between flex-wrap gap-6">
      <div>
        <div className="overline mb-3">{overline}</div>
        <h1 className="font-display text-4xl tracking-tighter">{title}</h1>
        {subtitle && <p className="text-zinc-400 mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, accent }) {
  return (
    <div className="p-6 bg-[#0A0A0A] border border-white/10">
      <div className="overline">{label}</div>
      <div className={"font-display text-4xl mt-3 tracking-tighter " + (accent === "green" ? "text-[#00E599]" : accent === "yellow" ? "text-[#FFE629]" : "text-white")}>
        {value}
      </div>
      {hint && <div className="font-mono text-[10px] text-zinc-500 mt-2 uppercase tracking-[0.2em]">{hint}</div>}
    </div>
  );
}

export function ScorePill({ value, label }) {
  const color = value >= 80 ? "text-[#00E599]" : value >= 55 ? "text-[#FFE629]" : "text-[#E5484D]";
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span className="text-zinc-500 uppercase tracking-[0.15em]">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}

export function ScoreRing({ value, size = 96, label }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  const color = value >= 80 ? "#00E599" : value >= 55 ? "#FFE629" : "#E5484D";
  return (
    <div className="inline-flex items-center gap-4">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
                strokeDasharray={c} strokeDashoffset={off} strokeLinecap="butt" />
      </svg>
      <div>
        <div className="font-display text-3xl tracking-tighter" style={{ color }}>{value}</div>
        <div className="overline">{label}</div>
      </div>
    </div>
  );
}

export function StatusDot({ status }) {
  const color = status === "ready" ? "#00E599" : status === "building" || status === "queued" ? "#FFE629" : "#E5484D";
  return <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />;
}
