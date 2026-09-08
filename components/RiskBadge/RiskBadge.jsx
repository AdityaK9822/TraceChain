const STYLES = {
  reported: { label: "Reported", className: "bg-accent-blue/15 text-accent-blue border-accent-blue/40" },
  exchange: { label: "Exchange Deposit", className: "bg-accent-red/15 text-accent-red border-accent-red/40" },
  intermediary: { label: "Intermediary", className: "bg-accent-amber/15 text-accent-amber border-accent-amber/40" },
  unknown: { label: "Unknown", className: "bg-accent-slate/15 text-text-secondary border-accent-slate/40" },
};

export default function RiskBadge({ tag, className = "" }) {
  const style = STYLES[tag] || STYLES.unknown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.className} ${className}`}
    >
      {style.label}
    </span>
  );
}

export const RISK_COLORS = {
  reported: "#3b82f6",
  exchange: "#ef4444",
  intermediary: "#f59e0b",
  unknown: "#64748b",
};
