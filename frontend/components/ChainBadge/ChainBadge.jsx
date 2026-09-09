"use client";

import { getChain } from "../../lib/chains";

export default function ChainBadge({ chain, size = "md", showSymbol = false }) {
  const chainData = getChain(chain);
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs"
  };
  
  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${chainData.color}15`,
        borderColor: `${chainData.color}40`,
        color: chainData.color
      }}
    >
      {chainData.label}
      {showSymbol && <span className="opacity-60">({chainData.symbol})</span>}
    </span>
  );
}
