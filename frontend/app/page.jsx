"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../components/Dashboard/DashboardShell";
import ComplaintFeed from "../components/Dashboard/ComplaintFeed";
import CaseHistoryList from "../components/Dashboard/CaseHistoryList";
import WalletInputForm from "../components/WalletInputForm/WalletInputForm";
import { traceWallet, listCases } from "../lib/api";

export default function HomePage() {
  const router = useRouter();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cases, setCases] = useState([]);

  useEffect(() => {
    listCases().then(setCases).catch(() => setCases([]));
  }, []);

  async function handleTrace({ walletAddress, maxHops }) {
    setLoading(true);
    setError("");
    try {
      const result = await traceWallet({ walletAddress, maxHops });
      router.push(`/case/${result.case_id}`);
    } catch (err) {
      setError(err.message || "Trace failed. Is the backend running?");
      setLoading(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Investigator Console</h1>
        <p className="text-text-secondary text-sm mt-1">
          Paste a reported wallet address to trace its fund flow and identify the exchange deposit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WalletInputForm onSubmit={handleTrace} loading={loading} initialAddress={selectedAddress} />
          {error && (
            <div className="rounded-md border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
              {error}
            </div>
          )}
          <ComplaintFeed onSelectAddress={setSelectedAddress} />
        </div>
        <div>
          <CaseHistoryList cases={cases} />
        </div>
      </div>
    </DashboardShell>
  );
}
