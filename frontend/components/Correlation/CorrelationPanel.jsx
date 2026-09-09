"use client";

import RiskBadge from "../RiskBadge/RiskBadge";
import { shortAddr } from "../../lib/chains";

function ConfidenceBadge({ confidence }) {
  let color, label;
  if (confidence >= 0.9) {
    color = "text-green-400 bg-green-500/20 border-green-500/30";
    label = "High";
  } else if (confidence >= 0.7) {
    color = "text-amber-400 bg-amber-500/20 border-amber-500/30";
    label = "Medium";
  } else {
    color = "text-slate-400 bg-slate-500/20 border-slate-500/30";
    label = "Low";
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
      {Math.round(confidence * 100)}% confidence ({label})
    </span>
  );
}

export default function CorrelationPanel({ correlation }) {
  if (!correlation) return null;

  const {
    prior_case_label,
    shared_wallets = [],
    shared_count,
    deposit_address_reused,
    predicted_deposit_address,
    predicted_vasp,
    confidence,
    rationale,
  } = correlation;

  return (
    <div className="rounded-2xl border border-[#232c3d] bg-[#10151f] p-5 space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">Historical Link Analysis</h2>
        <ConfidenceBadge confidence={confidence} />
      </div>

      {predicted_deposit_address && predicted_vasp && (
        <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎯</span>
            <span className="text-xs font-semibold text-purple-400">Predicted Deposit Address</span>
          </div>
          <p className="text-xs text-white/90 font-mono mb-2">{predicted_deposit_address}</p>
          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <span>→ {predicted_vasp.name}</span>
            <span>({predicted_vasp.jurisdiction})</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-white/70 leading-relaxed">{rationale}</p>
      </div>

      {shared_count > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white/80">
              Shared Wallets ({shared_count})
            </span>
            {deposit_address_reused && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Deposit Reused
              </span>
            )}
          </div>
          
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {shared_wallets.slice(0, 6).map((wallet, idx) => (
              <li
                key={wallet.address}
                className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/40 font-mono">#{idx + 1}</span>
                  <span className="text-xs font-mono text-white/80">{shortAddr(wallet.address)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/50">
                  <span>Live: Hop {wallet.live_hop}</span>
                  <span className="text-white/20">|</span>
                  <span>Hist: Hop {wallet.historical_hop}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-white/30 leading-relaxed border-t border-white/5 pt-2">
        AI-assisted correlation between live trace and historical patterns. Shared wallets indicate potential infrastructure reuse by the same fraudster.
      </p>
    </div>
  );
}
