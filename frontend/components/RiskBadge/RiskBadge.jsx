const STYLES = {
  reported: { label: "Reported", className: "bg-accent-blue/15 text-accent-blue border-accent-blue/40" },
  exchange: { label: "Exchange Deposit", className: "bg-accent-red/15 text-accent-red border-accent-red/40" },
  deposit_address: { label: "Deposit Address", className: "bg-purple-500/15 text-purple-400 border-purple-500/40" },
  mule: { label: "Mule Wallet", className: "bg-orange-500/15 text-orange-400 border-orange-500/40" },
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
  deposit_address: "#a855f7",
  mule: "#f97316",
  intermediary: "#f59e0b",
  unknown: "#64748b",
};

// Trust score: 100 = least suspicious behaviour, 0 = most. Deliberately
// separate from RISK_COLORS - risk_tag says how important a node is to the
// case, trust_score says how suspicious it looks. See core/trust_score.py.
export function trustScoreColor(score) {
  if (score == null) return "#64748b";
  if (score < 40) return "#ef4444";
  if (score < 70) return "#f59e0b";
  return "#22c55e";
}

export function TrustScoreBadge({ score, className = "" }) {
  if (score == null) return null;
  const color = trustScoreColor(score);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${className}`}
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}26` }}
      title="Trust score: 100 = least suspicious behaviour, 0 = most"
    >
      Trust {score}
    </span>
  );
}
