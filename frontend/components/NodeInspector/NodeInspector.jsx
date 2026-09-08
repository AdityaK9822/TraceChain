"use client";

import React, { useState, useEffect } from "react";
import RiskBadge, { RISK_COLORS } from "../RiskBadge/RiskBadge";
import { getWalletBalance } from "../../lib/api";

function shortAddr(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const RISK_EXPLANATIONS = {
  reported: {
    title: "Reported Target Wallet",
    description: "The primary subject or victim-reported seed wallet under active investigation.",
    severity: "Investigation Seed",
    severityColor: "text-accent-blue bg-accent-blue/10 border-accent-blue/30",
  },
  exchange: {
    title: "Exchange / VASP Cashout",
    description: "Identified as a known exchange or Virtual Asset Service Provider deposit wallet. Terminal hop where funds exited into custodial custody.",
    severity: "High Priority / Terminal",
    severityColor: "text-accent-red bg-accent-red/10 border-accent-red/30",
  },
  intermediary: {
    title: "High Fan-Out Intermediary",
    description: "Multiple distinct counterparty transactions detected (≥3 outgoing branches), indicating rapid dispersal or layering behavior.",
    severity: "Elevated Risk",
    severityColor: "text-accent-amber bg-accent-amber/10 border-accent-amber/30",
  },
  unknown: {
    title: "Standard Counterparty",
    description: "Passthrough or unflagged wallet address with no matching exchange tags or anomalous fan-out pattern.",
    severity: "Neutral / Unflagged",
    severityColor: "text-text-secondary bg-accent-slate/10 border-accent-slate/30",
  },
};

export default function NodeInspector({
  selectedItem, // { type: 'node', data: node } or { type: 'edge', data: edge }
  onClose,
  onTraceDirection, // ({ walletAddress, direction }) => void
  onSelectNode, // (node) => void
  network = "sepolia",
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  const isNode = selectedItem?.type === "node";
  const isEdge = selectedItem?.type === "edge";
  const node = isNode ? selectedItem.data : null;
  const edge = isEdge ? selectedItem.data : null;

  // Handle live balance fetch when node changes
  useEffect(() => {
    if (!isNode || !node?.id) {
      setBalance(null);
      setBalanceLoading(false);
      setBalanceError("");
      return;
    }

    let isMounted = true;
    setBalanceLoading(true);
    setBalanceError("");

    getWalletBalance(node.id, network)
      .then((res) => {
        if (isMounted) {
          setBalance(res.balance);
          setBalanceLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setBalanceError(err.message || "Failed to load live balance");
          setBalanceLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isNode, node?.id, network]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!selectedItem) {
    return null;
  }

  const explorerBase = network === "mainnet" ? "https://etherscan.io" : "https://sepolia.etherscan.io";
  const ethPrice = 2400; // Estimated USD value per ETH for demonstration

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#10151f]/95 backdrop-blur-2xl border-l border-[#232c3d] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-all duration-300 ease-out animate-in slide-in-from-right-8"
      aria-label="Node & Hop Inspector"
    >
      {/* Top Header */}
      <div className="p-5 border-b border-[#232c3d] flex items-center justify-between bg-black/30">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{
              backgroundColor: isNode
                ? RISK_COLORS[node?.risk_tag] || RISK_COLORS.unknown
                : "#3b82f6",
            }}
          />
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              {isNode ? "Wallet Inspector" : "Transaction Hop"}
            </h2>
            <p className="text-xs text-white/50">
              {isNode
                ? node?.hop === 0
                  ? "Investigation Origin"
                  : `Hop ${node?.hop} Counterparty`
                : `Hop ${edge?.hop} Transaction`}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Close inspector (Esc)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* ===================== NODE VIEW ===================== */}
        {isNode && (
          <>
            {/* Wallet Address Header Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Wallet Address</span>
                <RiskBadge tag={node.risk_tag} />
              </div>

              <div className="mono text-sm text-white/90 break-all select-all font-medium bg-black/40 p-2.5 rounded-lg border border-white/5">
                {node.id}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => copyToClipboard(node.id, "node_address")}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-colors flex items-center justify-center gap-1.5 font-medium"
                >
                  {copiedKey === "node_address" ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-400">Copied Address</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Address</span>
                    </>
                  )}
                </button>

                <a
                  href={`${explorerBase}/address/${node.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-colors flex items-center justify-center gap-1.5 font-medium"
                  title="View on Etherscan"
                >
                  <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Etherscan</span>
                </a>
              </div>
            </div>

            {/* Live ETH Balance Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/30 to-black/40 border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Live ETH Balance</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {network}
                </span>
              </div>

              {balanceLoading ? (
                <div className="py-3 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-white/60">Fetching live Etherscan balance...</span>
                </div>
              ) : balanceError ? (
                <div className="py-2">
                  <p className="text-xs text-rose-400">{balanceError}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {typeof balance === "number" ? balance.toFixed(5) : "0.00000"}
                    </span>
                    <span className="text-sm font-semibold text-blue-400">ETH</span>
                  </div>
                  <div className="text-xs text-white/50">
                    ≈{" "}
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                      (balance || 0) * ethPrice
                    )}{" "}
                    <span className="text-[10px] text-white/30">(est. @ ${ethPrice})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Risk Breakdown Section (Issue 2) */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Risk Classification</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${RISK_EXPLANATIONS[node.risk_tag]?.severityColor || "text-white/60 bg-white/5"}`}>
                  {RISK_EXPLANATIONS[node.risk_tag]?.severity || "Standard"}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white/90">
                  {RISK_EXPLANATIONS[node.risk_tag]?.title || "Unclassified Address"}
                </h4>
                <p className="text-xs text-white/60 leading-relaxed mt-1">
                  {RISK_EXPLANATIONS[node.risk_tag]?.description || "No specific heuristic triggers recorded."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-white/40 block text-[10px] uppercase">Hop Depth</span>
                  <span className="font-semibold text-white">Hop {node.hop}</span>
                </div>
                <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-white/40 block text-[10px] uppercase">Traced Volume</span>
                  <span className="font-semibold text-white">{node.total_value_eth?.toFixed(4) || "0.0000"} ETH</span>
                </div>
              </div>
            </div>

            {/* Known Entity Information (Issue 2) */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Entity Intelligence</h3>
                {node.label ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Matched
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                    Unattributed
                  </span>
                )}
              </div>

              {node.label ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent-red/20 text-accent-red flex items-center justify-center font-bold text-xs">
                      🏢
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{node.label}</div>
                      <div className="text-[11px] text-white/50">Centralized Exchange / VASP Deposit Wallet</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-accent-red/10 border border-accent-red/20 text-xs text-rose-300 flex items-start gap-2">
                    <svg className="w-4 h-4 text-accent-red shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      Funds reaching this wallet are subject to Exchange KYC/AML compliance records. Subpoena / LEA freeze request can be issued.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-white/50 leading-relaxed">
                  No registered exchange tags matched for this address in the LEA registry. Appears to be a self-custody / private Ethereum wallet.
                </div>
              )}
            </div>

            {/* Directional Tracing Controls */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Directional Tracing</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Manually control the hop expansion direction from this wallet node.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => onTraceDirection?.({ walletAddress: node.id, direction: "incoming" })}
                  className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-all flex items-center justify-center gap-2 text-xs font-semibold group shadow-sm active:scale-95"
                >
                  <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  Trace Incoming
                </button>

                <button
                  onClick={() => onTraceDirection?.({ walletAddress: node.id, direction: "outgoing" })}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all flex items-center justify-center gap-2 text-xs font-semibold group shadow-sm active:scale-95"
                >
                  Trace Outgoing
                  <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===================== EDGE VIEW ===================== */}
        {isEdge && (
          <>
            {/* Transaction Value Highlight Card */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-black/50 border border-indigo-500/20 space-y-2">
              <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Transferred Value</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">
                  {edge.value_eth ? edge.value_eth.toFixed(5) : "0.00000"}
                </span>
                <span className="text-sm font-semibold text-indigo-400">ETH</span>
              </div>
              <p className="text-xs text-white/50">
                ≈{" "}
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                  (edge.value_eth || 0) * ethPrice
                )}{" "}
                USD at timestamp
              </p>
            </div>

            {/* Hop Metadata Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 uppercase">Hop Level</span>
                <span className="font-semibold text-white px-2 py-0.5 rounded-full bg-white/10">Hop {edge.hop}</span>
              </div>

              {edge.timestamp && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                  <span className="text-white/40 uppercase">Block Timestamp</span>
                  <span className="font-medium text-white/80">
                    {new Date(edge.timestamp * 1000).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}

              {edge.tx_hash && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <span className="text-white/40 text-xs uppercase block">Transaction Hash</span>
                  <div className="mono text-xs text-white/90 break-all select-all font-medium bg-black/40 p-2 rounded-lg border border-white/5">
                    {edge.tx_hash}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(edge.tx_hash, "tx_hash")}
                      className="flex-1 py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-colors flex items-center justify-center gap-1"
                    >
                      {copiedKey === "tx_hash" ? (
                        <span className="text-green-400 font-medium">Copied Hash</span>
                      ) : (
                        <span>Copy Tx Hash</span>
                      )}
                    </button>
                    <a
                      href={`${explorerBase}/tx/${edge.tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-colors flex items-center justify-center gap-1 font-medium"
                    >
                      <span>View Tx</span>
                      <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Source & Destination Wallets Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Hop Endpoints</h3>

              {/* Source Wallet */}
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40 uppercase font-semibold">Source (Sender)</span>
                  <button
                    onClick={() =>
                      onSelectNode?.({
                        id: typeof edge.source === "object" ? edge.source.id : edge.source,
                        hop: Math.max(0, edge.hop - 1),
                        risk_tag: "unknown",
                      })
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Inspect Node →
                  </button>
                </div>
                <div className="mono text-xs text-white/80 truncate">
                  {typeof edge.source === "object" ? edge.source.id : edge.source}
                </div>
              </div>

              {/* Target Wallet */}
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40 uppercase font-semibold">Target (Recipient)</span>
                  <button
                    onClick={() =>
                      onSelectNode?.({
                        id: typeof edge.target === "object" ? edge.target.id : edge.target,
                        hop: edge.hop,
                        risk_tag: "unknown",
                      })
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Inspect Node →
                  </button>
                </div>
                <div className="mono text-xs text-white/80 truncate">
                  {typeof edge.target === "object" ? edge.target.id : edge.target}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer info banner */}
      <div className="p-3.5 border-t border-[#232c3d] bg-black/40 text-center">
        <span className="text-[11px] text-white/40 font-medium">
          TraceChain LEA • Hop-by-Hop Cryptographic Audit
        </span>
      </div>
    </aside>
  );
}
