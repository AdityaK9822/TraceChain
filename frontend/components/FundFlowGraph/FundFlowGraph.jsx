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
  expandingNodeIds = [],
  onNodeClick,
  onExpandNode,
  onLinkClick,
  onBackgroundClick,
}) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  const [visibleHop, setVisibleHop] = useState(animate ? 0 : Infinity);
  const animFrameRef = useRef(null);

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

  // Continuous animation loop for pulsing canvas effects & loading spinners
  useEffect(() => {
    let isRunning = true;
    function loop() {
      if (!isRunning) return;
      // Reheat/tick graph slightly to redraw dynamic canvas objects
      if (expandingNodeIds.length > 0) {
        // Redraw canvas frame
        if (graphRef.current) {
          graphRef.current.refresh?.();
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    }
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [expandingNodeIds]);

  const selectedNodeId = selectedItem?.type === "node" ? selectedItem.data?.id?.toLowerCase() : null;
  const selectedLinkHash = selectedItem?.type === "edge" ? selectedItem.data?.tx_hash?.toLowerCase() : null;
  const expandingSet = useMemo(() => new Set(expandingNodeIds.map((id) => id.toLowerCase())), [expandingNodeIds]);

  const graphData = useMemo(() => {
    const visibleNodes = nodes.filter((n) => n.hop <= visibleHop);
    const visibleIds = new Set(visibleNodes.map((n) => n.id.toLowerCase()));
    const visibleEdges = edges.filter(
      (e) => e.hop <= visibleHop && visibleIds.has(e.source.toLowerCase()) && visibleIds.has(e.target.toLowerCase())
    );

    return {
      nodes: visibleNodes.map((n) => {
        const volume = Number(n.total_value_eth) || 0;
        // Dynamic node value calculation based on transaction volume
        const val = n.risk_tag === "exchange" ? 14 : n.hop === 0 ? 12 : Math.min(16, Math.max(5, 5 + Math.log10(1 + volume * 10) * 3));
        return {
          ...n,
          val,
        };
      }),
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
        nodeLabel={(n) => `${n.label || shortAddr(n.id)} — ${n.risk_tag} (${(n.total_value_eth || 0).toFixed(4)} ETH)`}
        nodeColor={(n) => RISK_COLORS[n.risk_tag] || RISK_COLORS.unknown}
        nodeRelSize={4}
        nodeVal={(n) => n.val || 5}
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
          if (onExpandNode && !expandingSet.has(node.id.toLowerCase())) {
            onExpandNode(node);
          }
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
          const isExpanding = expandingSet.has(node.id?.toLowerCase());
          const isExchange = node.risk_tag === "exchange";
          const volume = Number(node.total_value_eth) || 0;

          // Dynamic radius scaled by volume
          const baseRadius = node.hop === 0 ? 9 : isExchange ? 10 : 6;
          const radius = Math.min(16, Math.max(5, baseRadius + Math.log10(1 + volume * 10) * 2.5));
          const nodeColor = RISK_COLORS[node.risk_tag] || RISK_COLORS.unknown;

          // 1. In-Canvas Visual Loading State: Pulsing and spinning loading ring around expanding node
          if (isExpanding) {
            const now = Date.now();
            const pulse = 1 + 0.25 * Math.sin(now / 150);
            const spinAngle = (now / 200) % (2 * Math.PI);
            const outerR = (radius + 7) / globalScale;

            // Outer pulsing glow aura
            ctx.beginPath();
            ctx.arc(node.x, node.y, outerR * pulse, 0, 2 * Math.PI, false);
            ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();

            // Inner spinning radar arc
            ctx.beginPath();
            ctx.arc(node.x, node.y, outerR, spinAngle, spinAngle + Math.PI * 1.2, false);
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2.5 / globalScale;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // 2. Selected Node Focus Halo
          if (isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, (radius + 4.5) / globalScale, 0, 2 * Math.PI, false);
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2.5 / globalScale;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // 3. Exchange Terminal Cashout Warning Beacon
          if (isExchange) {
            const pulse = 1 + 0.18 * Math.sin(Date.now() / 200);
            ctx.beginPath();
            ctx.arc(node.x, node.y, ((radius + 3) * pulse) / globalScale, 0, 2 * Math.PI, false);
            ctx.strokeStyle = RISK_COLORS.exchange;
            ctx.lineWidth = 1.8 / globalScale;
            ctx.stroke();
          }

          // 4. Render Node Label Text when zoomed in or focused
          if (globalScale > 0.75 || isSelected || isExchange || node.hop === 0) {
            const labelText = node.label || shortAddr(node.id);
            const fontSize = Math.max(10 / globalScale, 3);
            ctx.font = `${node.hop === 0 ? "bold " : ""}${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const textY = node.y + (radius + 6) / globalScale + fontSize / 2;
            
            // Text shadow / background badge
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillStyle = "rgba(10, 14, 23, 0.85)";
            ctx.fillRect(
              node.x - textWidth / 2 - 3 / globalScale,
              textY - fontSize / 2 - 1 / globalScale,
              textWidth + 6 / globalScale,
              fontSize + 2 / globalScale
            );

            ctx.fillStyle = isSelected ? "#38bdf8" : isExchange ? "#f87171" : "#e2e8f0";
            ctx.fillText(labelText, node.x, textY);
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


