"use client";

import { useEffect, useState } from "react";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export default function WalletInputForm({ onSubmit, loading, initialAddress = "" }) {
  const [address, setAddress] = useState(initialAddress);
  const [maxHops, setMaxHops] = useState(3);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialAddress) setAddress(initialAddress);
  }, [initialAddress]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!ADDRESS_PATTERN.test(trimmed)) {
      setError("Enter a valid 0x-prefixed Ethereum address (42 characters).");
      return;
    }
    setError("");
    onSubmit({ walletAddress: trimmed, maxHops });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl">
      <label className="block text-sm font-medium text-white mb-3">
        Fraudster's Wallet Address (Destination)
      </label>
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="font-mono flex-1 rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
          disabled={loading}
        />
        <select
          value={maxHops}
          onChange={(e) => setMaxHops(Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
          disabled={loading}
        >
          <option value={2}>2 hops</option>
          <option value={3}>3 hops (Recommended)</option>
          <option value={4}>4 hops</option>
          <option value={5}>5 hops</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(225,29,72,0.3)]"
        >
          {loading ? "Tracing…" : "Start Trace"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
    </form>
  );
}
