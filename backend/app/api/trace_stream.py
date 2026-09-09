"""Streaming trace endpoint - progressive real-time trace updates.

This endpoint streams the trace process as it happens, allowing the frontend
to display results progressively. The flow is:

1. Historical trace (fast, ~2-3s) - analyzes prior case if repeat offender
2. Correlation analysis - identifies shared wallets and predicts deposit address
3. Live trace (slow, ~6-7s) - follows current funds hop-by-hop
4. Deposit address confirmation - verifies prediction
5. Pattern analysis - identifies laundering patterns

This ordering is critical: historical analysis MUST complete before live trace
to demonstrate the prediction system's power.
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.chains import chain_symbol
from app.core.graph_builder import trace_wallet_async
from app.core.correlation import correlate
from app.core.attribution import find_deposit_address, tag_deposit_address
from app.core.pattern_analyzer import analyze_patterns
from app.core.trust_score import attach_trust_scores
from app.core.wallet_profile import attach_wallet_profiles
from app.core.risk_engine import classify_node
from app.data import scenarios
from app.models.case import TraceRequest

router = APIRouter()


async def trace_wallet_stream(request: TraceRequest):
    """Generator that yields SSE events as trace progresses."""
    
    # Event 1: Initialize
    case_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    yield f"data: {json.dumps({'event': 'init', 'case_id': case_id, 'chain': request.chain, 'created_at': created_at})}\n\n"
    await asyncio.sleep(0.1)
    
    # Check if this is a repeat offender
    scenario = scenarios.find_scenario_by_reported_address(request.wallet_address)
    has_historical = scenario and scenario.get("prior_slug")
    
    # Phase 1: Historical Trace (fast)
    historical_graph = None
    if has_historical:
        yield f"data: {json.dumps({'event': 'status', 'message': 'Analyzing historical patterns...'})}\n\n"
        await asyncio.sleep(0.2)
        
        prior = scenarios.get_scenario(scenario["prior_slug"])
        if prior:
            prior_address = scenarios.reported_address(prior)
            
            # Run historical trace (with_history=False to avoid recursion)
            historical_graph = await trace_wallet_async(
                wallet_address=prior_address,
                network=prior["chain"],
                max_hops=request.max_hops,
                max_branches_per_hop=request.max_branches_per_hop,
                direction=request.direction,
                with_history=False,
            )
            
            # Stream historical nodes (fast pace: 150ms per node)
            for node in historical_graph.nodes:
                yield f"data: {json.dumps({'event': 'historical_node', 'node': node})}\n\n"
                await asyncio.sleep(0.15)
            
            # Stream historical edges (faster: 100ms per edge)
            for edge in historical_graph.edges:
                yield f"data: {json.dumps({'event': 'historical_edge', 'edge': edge})}\n\n"
                await asyncio.sleep(0.1)
            
            # Historical deposit address
            if historical_graph.deposit_address:
                yield f"data: {json.dumps({'event': 'historical_deposit', 'deposit': historical_graph.deposit_address})}\n\n"
                await asyncio.sleep(0.3)
            
            case_label = f"case {prior.get('slug', 'unknown')}"
            yield f"data: {json.dumps({'event': 'historical_complete', 'case_label': case_label})}\n\n"
            await asyncio.sleep(0.2)
    
    # Phase 2: Correlation Analysis
    yield f"data: {json.dumps({'event': 'status', 'message': 'Running AI correlation analysis...'})}\n\n"
    await asyncio.sleep(0.5)
    
    # Phase 3: Live Trace (slow, progressive)
    yield f"data: {json.dumps({'event': 'status', 'message': 'Starting live trace...'})}\n\n"
    await asyncio.sleep(0.2)
    
    # Import necessary modules for live trace
    from app.core.blockchain_client import get_transactions_async
    from app.core import exchange_matcher
    from app.core.risk_engine import refine_intermediary_tags
    
    # Manual trace to stream nodes progressively
    seen_nodes = {}
    root = request.wallet_address.lower()
    seen_nodes[root] = {
        "id": request.wallet_address,
        "hop": 0,
        "risk_tag": "reported",
        "label": None,
        "exchange_network": None,
        "tx_count": 0,
        "total_value_eth": 0.0,
    }
    
    # Stream root node
    yield f"data: {json.dumps({'event': 'live_node', 'node': seen_nodes[root]})}\n\n"
    await asyncio.sleep(0.5)
    
    frontier = [request.wallet_address]
    visited_as_source = set()
    is_incoming = request.direction == "incoming"
    live_edges = []
    
    # Progressive hop-by-hop trace
    for hop in range(1, request.max_hops + 1):
        next_frontier = []
        
        active_sources = []
        for source in frontier:
            source_key = source.lower()
            if source_key in visited_as_source:
                continue
            if seen_nodes[source_key]["risk_tag"] == "exchange":
                continue
            active_sources.append(source)
            visited_as_source.add(source_key)
        
        if not active_sources:
            break
        
        # Fetch transactions for this hop
        fetch_tasks = [get_transactions_async(src, network=request.chain) for src in active_sources]
        results = await asyncio.gather(*fetch_tasks, return_exceptions=True)
        
        for source, result in zip(active_sources, results):
            if isinstance(result, Exception):
                continue
            
            source_key = source.lower()
            txs = result
            
            if is_incoming:
                relevant_txs = [tx for tx in txs if tx.get("to") and tx["to"].lower() == source_key]
            else:
                relevant_txs = [tx for tx in txs if tx.get("from") and tx["from"].lower() == source_key]
            
            relevant_txs.sort(key=lambda tx: tx["value_eth"], reverse=True)
            top_txs = relevant_txs[:request.max_branches_per_hop]
            
            for tx in top_txs:
                target = tx["from"] if is_incoming else tx["to"]
                if not target:
                    continue
                target_key = target.lower()
                
                # Create edge
                edge = {
                    "source": tx["from"],
                    "target": tx["to"],
                    "tx_hash": tx["hash"],
                    "value_eth": tx["value_eth"],
                    "timestamp": tx["timestamp"],
                    "hop": hop,
                }
                live_edges.append(edge)
                
                # Stream edge
                yield f"data: {json.dumps({'event': 'live_edge', 'edge': edge})}\n\n"
                
                if target_key not in seen_nodes:
                    exchange = exchange_matcher.match(target, network=request.chain)
                    node = {
                        "id": target,
                        "hop": hop,
                        "risk_tag": "unknown",
                        "label": exchange["label"] if exchange else None,
                        "exchange_network": exchange["network"] if exchange else None,
                        "tx_count": 0,
                        "total_value_eth": 0.0,
                    }
                    node["risk_tag"] = classify_node(node, exchange_match=exchange)
                    seen_nodes[target_key] = node
                    
                    if node["risk_tag"] != "exchange":
                        next_frontier.append(target)
                    
                    # Stream node
                    yield f"data: {json.dumps({'event': 'live_node', 'node': node})}\n\n"
                    await asyncio.sleep(0.9)  # Match frontend HOP_REVEAL_MS
                
                seen_nodes[target_key]["tx_count"] += 1
                seen_nodes[target_key]["total_value_eth"] += tx["value_eth"]
        
        frontier = next_frontier
        if not frontier:
            break
    
    # Refine intermediary tags
    live_nodes = refine_intermediary_tags(list(seen_nodes.values()), live_edges)
    
    # Get transaction history for all nodes (needed for scoring/attribution)
    yield f"data: {json.dumps({'event': 'status', 'message': 'Scoring wallets...'})}\n\n"
    
    tx_results = await asyncio.gather(
        *[get_transactions_async(n["id"], network=request.chain) for n in live_nodes],
        return_exceptions=True,
    )
    node_txs = {
        n["id"].lower(): (result if not isinstance(result, Exception) else [])
        for n, result in zip(live_nodes, tx_results)
    }
    
    # Attribution
    deposit = find_deposit_address(live_nodes, live_edges, node_txs, request.chain)
    live_nodes = tag_deposit_address(live_nodes, deposit)
    
    if deposit:
        yield f"data: {json.dumps({'event': 'deposit_found', 'deposit': deposit})}\n\n"
        await asyncio.sleep(0.3)
    
    # Correlation
    correlation_data = None
    if has_historical and historical_graph:
        yield f"data: {json.dumps({'event': 'status', 'message': 'Correlating with historical data...'})}\n\n"
        
        correlation_data = correlate(
            live_nodes=live_nodes,
            live_edges=live_edges,
            historical_nodes=historical_graph.nodes,
            historical_edges=historical_graph.edges,
            historical_deposit=historical_graph.deposit_address,
            chain=request.chain,
            prior_case_label=f"case {prior['slug']}" if has_historical else None,
        )
        
        if correlation_data:
            yield f"data: {json.dumps({'event': 'correlation', 'data': correlation_data})}\n\n"
            await asyncio.sleep(0.3)
    
    # Trust scoring and profiling
    live_nodes = attach_trust_scores(live_nodes, live_edges, node_txs, [])
    live_nodes = attach_wallet_profiles(live_nodes, live_edges, node_txs, [])
    
    # Promote mule behavior to risk_tag
    for node in live_nodes:
        if node.get("behavior") == "mule" and node["risk_tag"] in ("unknown", "intermediary"):
            node["risk_tag"] = "mule"
    
    # Pattern analysis
    pattern_findings = analyze_patterns(live_nodes, live_edges, chain=request.chain)
    yield f"data: {json.dumps({'event': 'patterns', 'findings': pattern_findings})}\n\n"
    await asyncio.sleep(0.2)
    
    # Summary
    from app.core.attribution import build_attribution_summary
    summary = build_attribution_summary(deposit)
    
    # Complete
    yield f"data: {json.dumps({'event': 'complete', 'case_id': case_id, 'summary': summary, 'asset_symbol': chain_symbol(request.chain)})}\n\n"


@router.post("/trace/stream")
async def stream_trace(request: TraceRequest):
    """Stream trace results progressively via Server-Sent Events."""
    
    return StreamingResponse(
        trace_wallet_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )
