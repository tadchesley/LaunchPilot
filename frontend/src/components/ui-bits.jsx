import React from "react";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="px-8 py-7 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight">{title}</h1>
        {subtitle && <p className="text-zinc-400 mt-1 text-sm max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, accent }) {
  return (
    <div className="p-5 bg-[#0A0A0A] border border-white/10 rounded-md">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={"font-display text-3xl mt-2 tracking-tight " + (accent === "green" ? "text-[#00E599]" : accent === "yellow" ? "text-[#FFE629]" : "text-white")}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-zinc-500 mt-1">{hint}</div>}
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
        <div className="font-display text-3xl tracking-tight" style={{ color }}>{value}</div>
        <div className="text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  );
}

export function StatusDot({ status }) {
  const color = status === "ready" || status === "up" ? "#00E599" : status === "building" || status === "queued" ? "#FFE629" : "#E5484D";
  return <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />;
}

export function Badge({ children, color = "gray" }) {
  const colors = {
    gray: "bg-white/5 text-zinc-300 border-white/10",
    green: "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20",
    yellow: "bg-[#FFE629]/10 text-[#FFE629] border-[#FFE629]/20",
    red: "bg-[#E5484D]/10 text-[#E5484D] border-[#E5484D]/20",
  };
  return (
    <span className={"inline-flex items-center px-2 py-0.5 text-[11px] rounded border " + (colors[color] || colors.gray)}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="border border-dashed border-white/15 p-16 text-center rounded-md">
      {Icon && <Icon className="mx-auto mb-4 text-zinc-500" size={32}/>}
      <div className="font-display text-2xl tracking-tight">{title}</div>
      {description && <p className="text-zinc-400 mt-2 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
