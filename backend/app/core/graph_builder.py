"""Hop-by-hop BFS tracing of a wallet's outgoing fund flow.

Starting from the reported wallet, we follow outgoing transactions up to
`max_hops` deep. At each hop we cap the number of branches we follow
(`max_branches_per_hop`, ranked by transaction value) so the resulting graph
stays small enough to read on a screen during a demo. A branch that lands on
a known exchange wallet is flagged and not expanded further - the money has
left the traceable chain.

This module is the orchestrator: once the graph is built it runs the pattern
detectors, trust scoring, wallet profiling and deposit-address attribution
over it, and - when the reported wallet belongs to an actor we have traced
before - traces that earlier case too and correlates the two.
"""

import asyncio
from dataclasses import dataclass, field

from app.core import attribution, exchange_matcher
from app.core.blockchain_client import get_transactions_async
from app.core.chains import chain_symbol
from app.core.correlation import correlate
from app.core.pattern_analyzer import analyze_patterns
from app.core.risk_engine import build_summary, classify_node, refine_intermediary_tags
from app.core.trust_score import attach_trust_scores
from app.core.wallet_profile import attach_wallet_profiles
from app.data import scenarios


@dataclass
class BuiltGraph:
    nodes: list[dict] = field(default_factory=list)
    edges: list[dict] = field(default_factory=list)
    flagged_exchange: dict | None = None
    summary: str = ""
    pattern_findings: list[dict] = field(default_factory=list)
    asset_symbol: str = ""
    deposit_address: dict | None = None
    vasp: dict | None = None
    historical: dict | None = None
    correlation: dict | None = None


async def trace_wallet_async(
    wallet_address: str,
    network: str,
    max_hops: int = 6,
    max_branches_per_hop: int = 5,
    direction: str = "outgoing",
    with_history: bool = True,
) -> BuiltGraph:
    graph = BuiltGraph()
    seen_nodes: dict[str, dict] = {}

    root = wallet_address.lower()
    seen_nodes[root] = {
        "id": wallet_address,
        "hop": 0,
        "risk_tag": "reported",
        "label": None,
        "exchange_network": None,
        "tx_count": 0,
        "total_value_eth": 0.0,
    }

    frontier = [wallet_address]
    visited_as_source: set[str] = set()

    is_incoming = direction == "incoming"

    for hop in range(1, max_hops + 1):
        next_frontier: list[str] = []
        
        # Filter frontier: only nodes we haven't expanded and aren't exchanges
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

        # Fetch all transactions concurrently
        fetch_tasks = [get_transactions_async(src, network=network) for src in active_sources]
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
            top_txs = relevant_txs[:max_branches_per_hop]


            for tx in top_txs:
                target = tx["from"] if is_incoming else tx["to"]
                if not target:
                    continue
                target_key = target.lower()

                edge_src = tx["from"]
                edge_tgt = tx["to"]

                graph.edges.append(
                    {
                        "source": edge_src,
                        "target": edge_tgt,
                        "tx_hash": tx["hash"],
                        "value_eth": tx["value_eth"],
                        "timestamp": tx["timestamp"],
                        "hop": hop,
                    }
                )

                if target_key not in seen_nodes:
                    exchange = exchange_matcher.match(target, network=network)
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

                    if node["risk_tag"] == "exchange":
                        if graph.flagged_exchange is None:
                            graph.flagged_exchange = node
                        # exchange nodes are terminal - never expanded further,
                        # regardless of whether this is the first exchange match
                        # or a later one
                    else:
                        next_frontier.append(target)

                seen_nodes[target_key]["tx_count"] += 1
                seen_nodes[target_key]["total_value_eth"] += tx["value_eth"]

        frontier = next_frontier
        if not frontier:
            break

    graph.nodes = refine_intermediary_tags(list(seen_nodes.values()), graph.edges)
    graph.asset_symbol = chain_symbol(network)
    graph.pattern_findings = analyze_patterns(graph.nodes, graph.edges, chain=network)

    # The scoring engines need each wallet's own history, including leaf nodes
    # that were never expanded as a BFS source.
    tx_results = await asyncio.gather(
        *[get_transactions_async(n["id"], network=network) for n in graph.nodes],
        return_exceptions=True,
    )
    node_txs = {
        n["id"].lower(): (result if not isinstance(result, Exception) else [])
        for n, result in zip(graph.nodes, tx_results)
    }

    # Attribution runs before scoring so the deposit address carries its own
    # tag into the trust score and behaviour profile.
    graph.deposit_address = attribution.find_deposit_address(
        graph.nodes, graph.edges, node_txs, network
    )
    graph.nodes = attribution.tag_deposit_address(graph.nodes, graph.deposit_address)
    if graph.deposit_address:
        graph.vasp = graph.deposit_address["vasp"]

    graph.nodes = attach_trust_scores(graph.nodes, graph.edges, node_txs, graph.pattern_findings)
    graph.nodes = attach_wallet_profiles(
        graph.nodes, graph.edges, node_txs, graph.pattern_findings
    )

    # Promote the behaviour verdict into the categorical tag so mules get their
    # own colour in the graph. Structural tags win - a deposit address stays a
    # deposit address even though it also behaves like a pass-through.
    for node in graph.nodes:
        if node.get("behavior") == "mule" and node["risk_tag"] in ("unknown", "intermediary"):
            node["risk_tag"] = "mule"

    if with_history:
        await _attach_history(graph, wallet_address, network, max_hops, max_branches_per_hop)

    graph.summary = _build_case_summary(wallet_address, graph, max_hops)
    return graph


async def _attach_history(
    graph: BuiltGraph,
    wallet_address: str,
    network: str,
    max_hops: int,
    max_branches_per_hop: int,
) -> None:
    """Trace this actor's previous case and correlate it with the live one.

    Which prior case belongs to which actor is fixture knowledge for the
    prototype (data/scenarios.py). In a real deployment this lookup would hit
    the case database - "have we traced any wallet in this graph before?" -
    rather than a scenario spec.
    """
    scenario = scenarios.find_scenario_by_reported_address(wallet_address)
    if not scenario or not scenario.get("prior_slug"):
        return

    prior = scenarios.get_scenario(scenario["prior_slug"])
    if not prior:
        return

    prior_address = scenarios.reported_address(prior)
    prior_graph = await trace_wallet_async(
        wallet_address=prior_address,
        network=prior["chain"],
        max_hops=max_hops,
        max_branches_per_hop=max_branches_per_hop,
        with_history=False,  # never recurse past one generation
    )

    prior_label = f"case {prior['slug']}"
    graph.historical = {
        "case_label": prior_label,
        "actor_id": prior.get("actor_id"),
        "wallet_address": prior_address,
        "chain": prior["chain"],
        "nodes": prior_graph.nodes,
        "edges": prior_graph.edges,
        "deposit_address": (
            prior_graph.deposit_address["address"] if prior_graph.deposit_address else None
        ),
        "occurred_days_ago": round(prior.get("hours_ago", 0) / 24),
    }

    graph.correlation = correlate(
        live_nodes=graph.nodes,
        live_edges=graph.edges,
        historical_nodes=prior_graph.nodes,
        historical_edges=prior_graph.edges,
        historical_deposit=prior_graph.deposit_address,
        chain=network,
        prior_case_label=prior_label,
    )


def _build_case_summary(wallet_address: str, graph: BuiltGraph, max_hops: int) -> str:
    """Lead with the deposit address - it is the actionable finding."""
    summary = attribution.build_attribution_summary(graph.deposit_address)
    if graph.correlation and graph.correlation.get("predicted_deposit_address"):
        summary += " " + graph.correlation["rationale"]
    if not graph.deposit_address:
        summary += " " + build_summary(
            wallet_address, graph.nodes, graph.flagged_exchange, max_hops
        )
    return summary

