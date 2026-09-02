"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "../../../components/Dashboard/DashboardShell";
import FundFlowGraph from "../../../components/FundFlowGraph/FundFlowGraph";
import RiskBadge from "../../../components/RiskBadge/RiskBadge";
import { getCase } from "../../../lib/api";

function shortAddr(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function CaseDetailPage() {
  const { caseId } = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState("");
  const [exchangeAlert, setExchangeAlert] = useState(null);

  useEffect(() => {
    getCase(caseId)
      .then(setCaseData)
      .catch((err) => setError(err.message || "Failed to load case."));
  }, [caseId]);

  return (
    <DashboardShell>
      {error && (
        <div className="rounded-md border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-accent-red mb-6">
          {error}
        </div>
      )}

      {caseData && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide">Case {caseData.case_id.slice(0, 8)}</p>
              <h1 className="mono text-xl font-semibold text-text-primary mt-1">{caseData.wallet_address}</h1>
              <p className="text-sm text-text-secondary mt-1">{caseData.summary}</p>
            </div>
            <button
              onClick={() => router.push(`/report/${caseData.case_id}`)}
              className="shrink-0 rounded-md bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:bg-accent-blue-dim"
            >
              Generate Report
            </button>
          </div>

          {exchangeAlert && (
            <div className="mb-4 rounded-md border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-accent-red flex items-center gap-2 animate-pulse">
              🚨 Exchange Deposit Detected — {exchangeAlert.label || exchangeAlert.id} ({exchangeAlert.exchange_network})
            </div>
          )}

          <FundFlowGraph
            nodes={caseData.nodes}
            edges={caseData.edges}
            onExchangeRevealed={setExchangeAlert}
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border-subtle bg-bg-panel p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Legend</h2>
              <div className="flex flex-wrap gap-2">
                <RiskBadge tag="reported" />
                <RiskBadge tag="exchange" />
                <RiskBadge tag="intermediary" />
                <RiskBadge tag="unknown" />
              </div>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-panel p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Wallets traced ({caseData.nodes.length})</h2>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {caseData.nodes.map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="mono text-text-secondary">{shortAddr(n.id)}</span>
                    <RiskBadge tag={n.risk_tag} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
