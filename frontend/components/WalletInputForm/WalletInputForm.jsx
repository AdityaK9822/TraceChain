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
    <form onSubmit={handleSubmit} className="rounded-lg border border-border-subtle bg-bg-panel p-5">
      <label className="block text-sm font-medium text-text-primary mb-2">
        Reported wallet address
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="mono flex-1 rounded-md border border-border-subtle bg-bg-panel-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          disabled={loading}
        />
        <select
          value={maxHops}
          onChange={(e) => setMaxHops(Number(e.target.value))}
          className="rounded-md border border-border-subtle bg-bg-panel-raised px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          disabled={loading}
        >
          <option value={2}>2 hops</option>
          <option value={3}>3 hops</option>
          <option value={4}>4 hops</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent-blue px-5 py-2 text-sm font-semibold text-white hover:bg-accent-blue-dim disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Tracing…" : "Trace wallet"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-accent-red">{error}</p>}
    </form>
  );
}
