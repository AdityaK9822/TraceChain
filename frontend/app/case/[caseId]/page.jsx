"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "../../../components/Dashboard/DashboardShell";
import FundFlowGraph from "../../../components/FundFlowGraph/FundFlowGraph";
import RiskBadge, { TrustScoreBadge } from "../../../components/RiskBadge/RiskBadge";
import NodeInspector from "../../../components/NodeInspector/NodeInspector";
import PatternAnalysis from "../../../components/PatternAnalysis/PatternAnalysis";
import LiveScoringPanel from "../../../components/LiveScoring/LiveScoringPanel";
import DepositAddressBanner from "../../../components/DepositAddress/DepositAddressBanner";
import CorrelationPanel from "../../../components/Correlation/CorrelationPanel";
import ChainBadge from "../../../components/ChainBadge/ChainBadge";
import { traceWalletStream } from "../../../lib/api";

function shortAddr(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function CaseDetailPage() {
  const { caseId } = useParams();
  const router = useRouter();
  const [selectedElement, setSelectedElement] = useState(null);
  
  // Progressive state for streaming data
  const [status, setStatus] = useState("Initializing...");
  const [chain, setChain] = useState("ethereum");
  const [assetSymbol, setAssetSymbol] = useState("ETH");
  const [createdAt, setCreatedAt] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [summary, setSummary] = useState("");
  
  // Historical graph data
  const [historicalNodes, setHistoricalNodes] = useState([]);
  const [historicalEdges, setHistoricalEdges] = useState([]);
  const [historicalDeposit, setHistoricalDeposit] = useState(null);
  const [historicalCaseLabel, setHistoricalCaseLabel] = useState("");
  
  // Live graph data
  const [liveNodes, setLiveNodes] = useState([]);
  const [liveEdges, setLiveEdges] = useState([]);
  
  // Correlation
  const [correlation, setCorrelation] = useState(null);
  
  // Deposit addresses
  const [predictedDeposit, setPredictedDeposit] = useState(null);
  const [confirmedDeposit, setConfirmedDeposit] = useState(null);
  
  // Pattern findings
  const [patternFindings, setPatternFindings] = useState([]);
  
  // Revealed nodes for live scoring
  const [revealedHop, setRevealedHop] = useState(0);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const address = searchParams.get('address');
    const chain = searchParams.get('chain') || 'ethereum';

    if (!address) {
      router.push('/');
      return;
    }

    setStatus("Initializing trace...");

    const abortController = new AbortController();

    traceWalletStream({
      walletAddress: address,
      chain,
      signal: abortController.signal,
      onEvent: handleTraceEvent,
    }).catch(err => {
      console.error("Stream error:", err);
      if (err.name !== 'AbortError') {
        setStatus("Trace complete");
      }
    });

    return () => {
      abortController.abort();
    };
  }, [caseId, router]);

  const handleTraceEvent = (event) => {
    switch (event.event) {
      case 'init':
        setChain(event.chain);
        setCreatedAt(event.created_at);
        setStatus("Loading...");
        break;
        
      case 'status':
        setStatus(event.message);
        break;
        
      case 'historical_node':
        setHistoricalNodes(prev => [...prev, event.node]);
        break;
      
      case 'historical_edge':
        setHistoricalEdges(prev => [...prev, event.edge]);
        break;
      
      case 'historical_deposit':
        setHistoricalDeposit(event.deposit);
        // Show prediction banner
        setPredictedDeposit({
          address: event.deposit.address,
          vasp: event.deposit.vasp,
          confidence: 0.85, // Will be updated by correlation
        });
        break;
      
      case 'historical_complete':
        setHistoricalCaseLabel(event.case_label);
        break;
      
      case 'live_node':
        setLiveNodes(prev => [...prev, event.node]);
        setRevealedHop(event.node.hop);
        setWalletAddress(prev => prev || event.node.id); // Set on first node
        break;
      
      case 'live_edge':
        setLiveEdges(prev => [...prev, event.edge]);
        break;
      
      case 'correlation':
        setCorrelation(event.data);
        // Update prediction with actual correlation data
        if (event.data.predicted_deposit_address) {
          setPredictedDeposit({
            address: event.data.predicted_deposit_address,
            vasp: event.data.predicted_vasp,
            confidence: event.data.confidence,
            rationale: event.data.rationale,
          });
        }
        break;
      
      case 'deposit_found':
        setConfirmedDeposit(event.deposit);
        setPredictedDeposit(null); // Hide prediction banner
        break;
      
      case 'patterns':
        setPatternFindings(event.findings);
        break;
      
      case 'complete':
        setSummary(event.summary);
        setAssetSymbol(event.asset_symbol);
        setStatus("Trace complete");
        break;
    }
  };

  const handleSelectNode = (node) => {
    const fullNode = liveNodes.find((n) => n.id.toLowerCase() === (node.id || node).toLowerCase()) || node;
    setSelectedElement({ type: "node", data: fullNode });
  };

  const handleSelectEdge = (edge) => {
    setSelectedElement({ type: "edge", data: edge });
  };

  const handleHopRevealed = (hop) => {
    // Already handled by live_node events
  };

  const matchedNodeIds = correlation?.shared_wallets?.map(w => w.address) || [];

  const shouldShowPredictedBanner = predictedDeposit && !confirmedDeposit;
  const shouldShowConfirmedBanner = confirmedDeposit;

  return (
    <DashboardShell>

      {/* Status Banner */}
      {status && status !== "Trace complete" && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-400 mb-6 animate-in fade-in flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          {status}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-text-secondary uppercase tracking-wide">Case {caseId}</p>
            <ChainBadge chain={chain} />
          </div>
          <h1 className="mono text-xl md:text-2xl font-semibold text-text-primary">
            {shortAddr(walletAddress) || "Loading..."}
          </h1>
          {summary && (
            <p className="text-sm text-text-secondary mt-1 max-w-3xl">{summary}</p>
          )}
        </div>
        {confirmedDeposit && (
          <button
            onClick={() => router.push(`/report/${caseId}`)}
            className="shrink-0 rounded-xl bg-accent-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-blue-dim transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95"
          >
            Generate Report
          </button>
        )}
      </div>

      {/* Deposit Address Banners */}
      {shouldShowPredictedBanner && (
        <DepositAddressBanner
          state="predicted"
          address={predictedDeposit.address}
          confidence={predictedDeposit.confidence}
          caseLabel={historicalCaseLabel}
        />
      )}
      {shouldShowConfirmedBanner && (
        <DepositAddressBanner
          state="confirmed"
          address={confirmedDeposit.address}
          vasp={confirmedDeposit.vasp}
        />
      )}

      {/* Dual Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Live Trace
          </h3>
          <FundFlowGraph
            nodes={liveNodes}
            edges={liveEdges}
            matchedNodeIds={matchedNodeIds}
            variant="live"
            animate={false}
            onHopRevealed={handleHopRevealed}
            selectedItem={selectedElement}
            onNodeClick={handleSelectNode}
            onLinkClick={handleSelectEdge}
            onBackgroundClick={() => setSelectedElement(null)}
          />
        </div>
        {historicalNodes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Historical Path ({historicalCaseLabel})
            </h3>
            <FundFlowGraph
              nodes={historicalNodes}
              edges={historicalEdges}
              matchedNodeIds={matchedNodeIds}
              variant="historical"
              animate={false}
            />
          </div>
        )}
      </div>

      {/* Live Scoring and Correlation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <LiveScoringPanel
          nodes={liveNodes.filter(n => n.hop <= revealedHop)}
          assetSymbol={assetSymbol}
        />
        {correlation && (
          <CorrelationPanel correlation={correlation} />
        )}
      </div>

      {/* Pattern Analysis */}
      {patternFindings.length > 0 && (
        <div className="mb-6">
          <PatternAnalysis
            findings={patternFindings}
            onSelectNode={handleSelectNode}
          />
        </div>
      )}

      {/* Risk Legend and Wallets List */}
      {liveNodes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#232c3d] bg-[#10151f] p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Risk Classification Legend</h2>
            <div className="flex flex-wrap gap-2.5">
              <RiskBadge tag="reported" />
              <RiskBadge tag="mule" />
              <RiskBadge tag="deposit_address" />
              <RiskBadge tag="exchange" />
              <RiskBadge tag="intermediary" />
              <RiskBadge tag="unknown" />
            </div>
            <p className="text-xs text-white/40 mt-3 leading-relaxed">
              Nodes are tagged based on heuristic analysis: Reported seed origin, Identified laundering mules, VASP deposit addresses, Known exchange hot wallets, High fan-out intermediaries.
            </p>
          </div>

          <div className="rounded-2xl border border-[#232c3d] bg-[#10151f] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Wallets Traced ({liveNodes.length})</h2>
              <span className="text-xs text-white/40">Click row to inspect</span>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {liveNodes.map((n) => {
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
                      <TrustScoreBadge score={n.trust_score} />
                      <RiskBadge tag={n.risk_tag} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Node Inspector */}
      {selectedElement && (
        <NodeInspector
          selectedItem={selectedElement}
          onClose={() => setSelectedElement(null)}
          onSelectNode={handleSelectNode}
          chain={chain}
        />
      )}
    </DashboardShell>
  );
}
