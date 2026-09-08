"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "../../../components/Dashboard/DashboardShell";
import FundFlowGraph from "../../../components/FundFlowGraph/FundFlowGraph";
import RiskBadge from "../../../components/RiskBadge/RiskBadge";
import NodeInspector from "../../../components/NodeInspector/NodeInspector";
import { getCase, traceWallet } from "../../../lib/api";

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
  const [selectedElement, setSelectedElement] = useState(null);
  const [tracingLoading, setTracingLoading] = useState(false);

  useEffect(() => {
    getCase(caseId)
      .then((data) => {
        setCaseData(data);
        // Default select the root node if available
        const rootNode = data?.nodes?.find((n) => n.hop === 0) || data?.nodes?.[0];
        if (rootNode) {
          setSelectedElement({ type: "node", data: rootNode });
        }
      })
      .catch((err) => setError(err.message || "Failed to load case."));
  }, [caseId]);

  const handleSelectNode = (node) => {
    // Find node in caseData if only partial data provided
    const fullNode = caseData?.nodes?.find((n) => n.id.toLowerCase() === (node.id || node).toLowerCase()) || node;
    setSelectedElement({ type: "node", data: fullNode });
  };

  const handleSelectEdge = (edge) => {
    setSelectedElement({ type: "edge", data: edge });
  };

  const handleDirectionalTrace = async ({ walletAddress, direction }) => {
    setTracingLoading(true);
    setError("");
    try {
      const result = await traceWallet({
        walletAddress,
        direction,
        maxHops: 3,
        maxBranchesPerHop: 5,
      });
      router.push(`/case/${result.case_id}`);
    } catch (err) {
      setError(err.message || `Failed to trace ${direction} funds for this wallet.`);
    } finally {
      setTracingLoading(false);
    }
  };

  return (
    <DashboardShell>
      {error && (
        <div className="rounded-xl border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-accent-red mb-6 animate-in fade-in">
          {error}
        </div>
      )}

      {tracingLoading && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm font-medium">Tracing hop-by-hop fund flow...</p>
        </div>
      )}

      {caseData && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-text-secondary uppercase tracking-wide">Case {caseData.case_id.slice(0, 8)}</p>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {caseData.chain || "ethereum"}
                </span>
              </div>
              <h1 className="mono text-xl md:text-2xl font-semibold text-text-primary mt-1">{caseData.wallet_address}</h1>
              <p className="text-sm text-text-secondary mt-1 max-w-3xl">{caseData.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/report/${caseData.case_id}`)}
                className="shrink-0 rounded-xl bg-accent-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-blue-dim transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95"
              >
                Generate Report
              </button>
            </div>
          </div>

          {exchangeAlert && (
            <div className="mb-4 rounded-xl border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-accent-red flex items-center justify-between gap-2 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              <div className="flex items-center gap-2">
                <span>🚨</span>
                <span className="font-semibold">Exchange Deposit Detected:</span>
                <span>{exchangeAlert.label || exchangeAlert.id} ({exchangeAlert.exchange_network || "Sepolia"})</span>
              </div>
              <button
                onClick={() => handleSelectNode(exchangeAlert)}
                className="text-xs underline hover:text-white font-medium"
              >
                Inspect Cashout Hop →
              </button>
            </div>
          )}

          {/* Interactive Graph Area */}
          <div className="relative">
            <FundFlowGraph
              nodes={caseData.nodes}
              edges={caseData.edges}
              onExchangeRevealed={setExchangeAlert}
              selectedItem={selectedElement}
              onNodeClick={handleSelectNode}
              onLinkClick={handleSelectEdge}
              onBackgroundClick={() => setSelectedElement(null)}
            />

            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 pointer-events-none">
              Click any node or link to open Inspector Sidebar
            </div>
          </div>

          {/* Slide-in Node & Edge Inspector Sidebar */}
          <NodeInspector
            selectedItem={selectedElement}
            onClose={() => setSelectedElement(null)}
            onTraceDirection={handleDirectionalTrace}
            onSelectNode={handleSelectNode}
            network={caseData.chain === "ethereum-mainnet" ? "mainnet" : "sepolia"}
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#232c3d] bg-[#10151f] p-5 shadow-xl">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Risk Classification Legend</h2>
              <div className="flex flex-wrap gap-2.5">
                <RiskBadge tag="reported" />
                <RiskBadge tag="exchange" />
                <RiskBadge tag="intermediary" />
                <RiskBadge tag="unknown" />
              </div>
              <p className="text-xs text-white/40 mt-3 leading-relaxed">
                Nodes are tagged based on heuristic analysis: Reported seed origin, Known Exchange VASP cashouts, High fan-out intermediaries, and unclassified counterparties.
              </p>
            </div>

            <div className="rounded-2xl border border-[#232c3d] bg-[#10151f] p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-primary">Wallets Traced ({caseData.nodes.length})</h2>
                <span className="text-xs text-white/40">Click row to inspect</span>
              </div>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {caseData.nodes.map((n) => {
                  const isSelected = selectedElement?.type === "node" && selectedElement.data?.id?.toLowerCase() === n.id.toLowerCase();
                  return (
                    <li
                      key={n.id}
                      onClick={() => handleSelectNode(n)}
                      className={`flex items-center justify-between gap-3 text-sm p-2 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600/20 border border-blue-500/40 text-white"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <span className="mono text-text-secondary text-xs truncate">{shortAddr(n.id)}</span>
                      <div className="flex items-center gap-2">
                        {n.label && <span className="text-[11px] text-accent-red font-medium truncate max-w-[120px]">{n.label}</span>}
                        <RiskBadge tag={n.risk_tag} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

