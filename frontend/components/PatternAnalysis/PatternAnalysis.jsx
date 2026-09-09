"use client";

const PATTERN_META = {
  sweep: {
    label: "Sweep / Collection Address",
    icon: "🔀",
  },
  peel_chain: {
    label: "Peel Chain Layering",
    icon: "🧅",
  },
  structuring: {
    label: "Rapid Relay / Structuring",
    icon: "⏱️",
  },
  round_number: {
    label: "Round-Number Transfer",
    icon: "🎯",
  },
};

const SEVERITY_STYLES = {
  high: "bg-accent-red/15 text-accent-red border-accent-red/40",
  medium: "bg-accent-amber/15 text-accent-amber border-accent-amber/40",
  low: "bg-accent-slate/15 text-text-secondary border-accent-slate/40",
};

function shortAddr(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function PatternAnalysis({ findings = [], onSelectNode }) {
  return (
    <div className="rounded-2xl border border-[#232c3d] bg-[#10151f] p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">AI-Assisted Analysis</h2>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {findings.length} finding{findings.length === 1 ? "" : "s"}
        </span>
      </div>

      {findings.length === 0 ? (
        <p className="text-xs text-white/40 leading-relaxed py-4 text-center">
          No suspicious patterns detected in this trace.
        </p>
      ) : (
        <ul className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {findings.map((f, idx) => {
            const meta = PATTERN_META[f.pattern_type] || { label: f.pattern_type, icon: "•" };
            const severityClass = SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.low;
            return (
              <li
                key={`${f.pattern_type}-${idx}`}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-medium text-text-primary">
                    {meta.icon} {meta.label}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${severityClass}`}
                  >
                    {f.severity}
                  </span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">{f.description}</p>
                {f.node_ids?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {f.node_ids.slice(0, 6).map((id) => (
                      <button
                        key={id}
                        onClick={() => onSelectNode?.({ id })}
                        className="mono text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/60 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
                      >
                        {shortAddr(id)}
                      </button>
                    ))}
                    {f.node_ids.length > 6 && (
                      <span className="text-[10px] text-white/30 px-1 py-0.5">
                        +{f.node_ids.length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[10px] text-white/30 mt-3 leading-relaxed border-t border-white/5 pt-2">
        Heuristic pattern analysis over the traced graph — sweep, peel-chain, structuring and
        round-number detection. Findings are investigative leads, not conclusions.
      </p>
    </div>
  );
}
