"use client";

import { useState } from "react";
import { shortAddr } from "../../lib/chains";

export default function DepositAddressBanner({ 
  state,
  address,
  confidence,
  caseLabel,
  vasp 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!address) return null;

  if (state === "predicted") {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6 animate-in fade-in">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-amber-400">Predicted Deposit Address</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {confidence}% confidence
              </span>
            </div>
            <p className="text-xs text-white/80 font-mono mb-2">{address}</p>
            <p className="text-[11px] text-white/50">
              From {caseLabel || "prior case"} • Funds predicted to arrive here based on historical correlation
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "confirmed") {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 mb-6 animate-in fade-in">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-green-400">Deposit Address Found</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                Actionable
              </span>
            </div>
            
            <p className="text-xs text-white/90 font-mono mb-3">{address}</p>
            
            {vasp && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">VASP:</span>
                  <span className="text-white font-semibold">{vasp.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Jurisdiction:</span>
                  <span className="text-white/80">{vasp.jurisdiction}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">KYC Contact:</span>
                  <span className="text-blue-400">{vasp.kyc_contact}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Response SLA:</span>
                  <span className="text-white/80">{vasp.response_sla_days} days</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-colors flex items-center justify-center gap-1.5 font-medium"
              >
                {copied ? (
                  <>
                    <span className="text-green-400">✓</span>
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy Address for KYC Request</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-white/40 mt-3 leading-relaxed">
              Serve a KYC/subscriber request to {vasp?.name || "the VASP"} to identify the account holder behind this deposit address.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
