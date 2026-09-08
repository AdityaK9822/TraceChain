"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { RISK_COLORS } from "../RiskBadge/RiskBadge";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const HOP_REVEAL_MS = 900;

function shortAddr(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function FundFlowGraph({
  nodes = [],
  edges = [],
  animate = true,
  onExchangeRevealed,
  selectedItem = null,
  onNodeClick,
  onLinkClick,
  onBackgroundClick,
}) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  const [visibleHop, setVisibleHop] = useState(animate ? 0 : Infinity);

  const maxHop = useMemo(() => nodes.reduce((m, n) => Math.max(m, n.hop), 0), [nodes]);

  useEffect(() => {
    if (!animate) {
      setVisibleHop(Infinity);
      return;
    }
    setVisibleHop(0);
    if (maxHop === 0) return;
    const timers = [];
    for (let hop = 1; hop <= maxHop; hop++) {
      timers.push(
        setTimeout(() => setVisibleHop(hop), hop * HOP_REVEAL_MS)
      );
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, animate, maxHop]);

  useEffect(() => {
    if (!onExchangeRevealed) return;
    const revealedExchange = nodes.find((n) => n.risk_tag === "exchange" && n.hop <= visibleHop);
    if (revealedExchange) onExchangeRevealed(revealedExchange);
  }, [visibleHop, nodes, onExchangeRevealed]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({ width: entry.contentRect.width, height: Math.max(480, entry.contentRect.height) });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const selectedNodeId = selectedItem?.type === "node" ? selectedItem.data?.id?.toLowerCase() : null;
  const selectedLinkHash = selectedItem?.type === "edge" ? selectedItem.data?.tx_hash?.toLowerCase() : null;

  const graphData = useMemo(() => {
    const visibleNodes = nodes.filter((n) => n.hop <= visibleHop);
    const visibleIds = new Set(visibleNodes.map((n) => n.id.toLowerCase()));
    const visibleEdges = edges.filter(
      (e) => e.hop <= visibleHop && visibleIds.has(e.source.toLowerCase()) && visibleIds.has(e.target.toLowerCase())
    );
    return {
      nodes: visibleNodes.map((n) => ({
        ...n,
        val: n.risk_tag === "exchange" ? 10 : n.hop === 0 ? 8 : 5,
      })),
      links: visibleEdges.map((e) => ({
        source: e.source,
        target: e.target,
        value_eth: e.value_eth,
        tx_hash: e.tx_hash,
        timestamp: e.timestamp,
        hop: e.hop,
      })),
    };
  }, [nodes, edges, visibleHop]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] rounded-2xl border border-[#232c3d] bg-[#10151f] overflow-hidden shadow-2xl"
    >
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="transparent"
        nodeId="id"
        nodeLabel={(n) => `${n.label || shortAddr(n.id)} — ${n.risk_tag}`}
        nodeColor={(n) => RISK_COLORS[n.risk_tag] || RISK_COLORS.unknown}
        nodeRelSize={4}
        linkColor={(link) => {
          const isSelected = selectedLinkHash && link.tx_hash?.toLowerCase() === selectedLinkHash;
          return isSelected ? "#38bdf8" : "rgba(139, 150, 171, 0.35)";
        }}
        linkWidth={(link) => {
          const isSelected = selectedLinkHash && link.tx_hash?.toLowerCase() === selectedLinkHash;
          return isSelected ? 3.5 : 1.5;
        }}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={(l) => (l.value_eth > 0 ? 3 : 0)}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleWidth={(link) => {
          const isSelected = selectedLinkHash && link.tx_hash?.toLowerCase() === selectedLinkHash;
          return isSelected ? 3.5 : 2;
        }}
        linkLabel={(l) => `${l.value_eth.toFixed(5)} ETH (Click for details)`}
        cooldownTicks={80}
        onEngineStop={() => graphRef.current?.zoomToFit(400, 60)}
        onNodeClick={(node) => {
          onNodeClick?.(node);
        }}
        onLinkClick={(link) => {
          onLinkClick?.(link);
        }}
        onBackgroundClick={() => {
          onBackgroundClick?.();
        }}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const isSelected = selectedNodeId && node.id?.toLowerCase() === selectedNodeId;
          const isExchange = node.risk_tag === "exchange";

          if (isSelected) {
            // Glowing focus halo around selected node
            ctx.beginPath();
            ctx.arc(node.x, node.y, 12 / globalScale, 0, 2 * Math.PI, false);
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2.5 / globalScale;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
          }

          if (isExchange) {
            const pulse = 1 + 0.15 * Math.sin(Date.now() / 200);
            ctx.beginPath();
            ctx.arc(node.x, node.y, (8 * pulse) / globalScale, 0, 2 * Math.PI, false);
            ctx.strokeStyle = RISK_COLORS.exchange;
            ctx.lineWidth = 1.5 / globalScale;
            ctx.stroke();
          }
        }}
      />
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm">
          No trace data yet.
        </div>
      )}
    </div>
  );
}

