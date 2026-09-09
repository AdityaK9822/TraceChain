"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChainBadge from "../ChainBadge/ChainBadge";
import { detectChain, isValidAddress } from "../../lib/chains";
import { traceWalletStream } from "../../lib/api";

export default function AddressSearch({ 
  initialAddress = "", 
  initialChain = null,
  onInvestigate 
}) {
  const router = useRouter();
  const [address, setAddress] = useState(initialAddress);
  const [chain, setChain] = useState(initialChain);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync with parent state when feed entry is clicked
  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
      if (initialChain) {
        setChain(initialChain);
      } else {
        const detected = detectChain(initialAddress);
        setChain(detected);
      }
      setError("");
    }
  }, [initialAddress, initialChain]);

  const handleAddressChange = (value) => {
    setAddress(value);
    setError("");
    
    if (value.trim()) {
      const detected = detectChain(value.trim());
      setChain(detected);
    } else {
      setChain(null);
    }
  };

  const handleInvestigate = async () => {
    const trimmed = address.trim();
    
    if (!trimmed) {
      setError("Please enter a wallet address");
      return;
    }

    const detectedChain = chain || detectChain(trimmed);
    
    if (!detectedChain) {
      setError("Unrecognized address format. Please enter a valid address.");
      return;
    }

    if (!isValidAddress(trimmed, detectedChain)) {
      setError(`Invalid ${detectedChain} address format.`);
      return;
    }

    if (onInvestigate) {
      onInvestigate(trimmed, detectedChain);
    }
    
    const tempCaseId = `pending-${Date.now()}`;
    const params = new URLSearchParams({
      address: trimmed,
      chain: detectedChain,
    });
    
    router.push(`/case/${tempCaseId}?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleInvestigate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Wallet Address</label>
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter wallet address to trace..."
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all font-mono text-sm disabled:opacity-50"
          />
          {chain && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <ChainBadge chain={chain} size="sm" showSymbol />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 animate-in fade-in">
          {error}
        </div>
      )}

      <button
        onClick={handleInvestigate}
        disabled={loading || !address.trim()}
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Tracing Funds...</span>
          </>
        ) : (
          <>
            <span>Investigate</span>
            <span className="text-lg">🔍</span>
          </>
        )}
      </button>

      <p className="text-[11px] text-white/30 leading-relaxed">
        Supported chains: Ethereum, Bitcoin, Tron, BSC, Polygon, Solana
      </p>
    </div>
  );
}
