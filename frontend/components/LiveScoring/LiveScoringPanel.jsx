"use client";

import RiskBadge, { TrustScoreBadge } from "../RiskBadge/RiskBadge";
import { shortAddr } from "../../lib/chains";

function BehaviorIcon(behavior) {
  switch (behavior) {
    case "mule":
      return "⚠️";
    case "personal":
      return "✅";
    case "service":
      return "🏢";
    case "deposit":
      return "💎";
    default:
      return "❓";
  }
}

function BehaviorLabel(behavior) {
  switch (behavior) {
    case "mule":
      return "Laundering Mule Wallet";
    case "personal":
      return "Genuine Personal Wallet";
    case "service":
      return "Service/Business Wallet";
    case "deposit":
      return "Deposit Address";
    default:
      return "Unclassified";
  }
}

export default function LiveScoringPanel({ nodes = [], assetSymbol = "ETH" }) {
  if (nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-[#232c3d] bg-[#10151f] p-5">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Scanning wallet history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#232c3d] bg-[#10151f] p-5 space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">Wallet Classification</h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {nodes.length} wallet{nodes.length !== 1 ? "s" : ""}
        </span>
      </div>

      <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {nodes.map((node) => {
          const isMule = node.behavior === "mule";
          
          return (
            <li
              key={node.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3 animate-in fade-in"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{BehaviorIcon(node.behavior)}</span>
                  <div>
                    <p className="text-xs font-mono text-white/80">{shortAddr(node.id)}</p>
                    <p className={`text-[11px] font-semibold ${isMule ? "text-orange-400" : "text-green-400"}`}>
                      {BehaviorLabel(node.behavior)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrustScoreBadge score={node.trust_score} />
                  <RiskBadge tag={node.risk_tag} />
                </div>
              </div>

              {node.behavior_reasons && node.behavior_reasons.length > 0 && (
                <ul className="mt-2 space-y-1 pl-6">
                  {node.behavior_reasons.slice(0, 3).map((reason, idx) => (
                    <li key={idx} className="text-[10px] text-white/50 leading-relaxed">
                      • {reason}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-[10px] text-white/30 leading-relaxed border-t border-white/5 pt-2">
        Behavior profiles generated from transaction history, fan-out patterns, and activity lifespan.
        Trust score: 100 = least suspicious, 0 = most suspicious.
      </p>
    </div>
  );
}
