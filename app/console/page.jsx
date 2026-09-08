"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "../../components/Dashboard/DashboardShell";
import ComplaintFeed from "../../components/Dashboard/ComplaintFeed";
import CaseHistoryList from "../../components/Dashboard/CaseHistoryList";
import WalletInputForm from "../../components/WalletInputForm/WalletInputForm";
import WalletOverview from "../../components/Dashboard/WalletOverview";
import { traceWallet, listCases } from "../../lib/api";

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardShell>Loading...</DashboardShell>}>
      <ConsoleContent />
    </Suspense>
  );
}

function ConsoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialWallet = searchParams.get("wallet") || "";
  
  const [selectedAddress, setSelectedAddress] = useState(initialWallet);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cases, setCases] = useState([]);
  
  // State to manage whether we are viewing the connected wallet or actively tracing
  const [isTracingMode, setIsTracingMode] = useState(false);

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
      {!isTracingMode ? (
        <WalletOverview 
          walletAddress={initialWallet} 
          onTraceClick={() => setIsTracingMode(true)} 
        />
      ) : (
        <div className="animate-in slide-in-from-right-8 duration-500 fade-in">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Trace Fraudster Wallet</h1>
              <p className="text-white/50 text-sm mt-2 max-w-2xl">
                Paste the wallet address you sent funds to. We will trace its fund flow hop-by-hop and unmask the final exchange deposit address.
              </p>
            </div>
            <button 
              onClick={() => setIsTracingMode(false)}
              className="px-4 py-2 text-sm text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
            >
              &larr; Back to Wallet
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <WalletInputForm onSubmit={handleTrace} loading={loading} initialAddress={selectedAddress} />
              {error && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.1)]">
                  {error}
                </div>
              )}
              {/* Optional: if you want to keep the Complaint feed visible here */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Or select from reported complaints</h3>
                <ComplaintFeed onSelectAddress={setSelectedAddress} />
              </div>
            </div>
            <div>
              <CaseHistoryList cases={cases} />
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
