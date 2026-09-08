"""Hop-by-hop BFS tracing of a wallet's outgoing fund flow.

Starting from the reported wallet, we follow outgoing transactions up to
`max_hops` deep. At each hop we cap the number of branches we follow
(`max_branches_per_hop`, ranked by transaction value) so the resulting graph
stays small enough to read on a screen during a demo. A branch that lands on
a known exchange wallet is flagged and not expanded further - the money has
left the traceable chain.
"""

import asyncio
from dataclasses import dataclass, field

from app.core import exchange_matcher
from app.core.blockchain_client import get_transactions_async
from app.core.risk_engine import build_summary, classify_node, refine_intermediary_tags


@dataclass
class BuiltGraph:
    nodes: list[dict] = field(default_factory=list)
    edges: list[dict] = field(default_factory=list)
    flagged_exchange: dict | None = None
    summary: str = ""


async def trace_wallet_async(
    wallet_address: str,
    network: str,
    max_hops: int = 3,
    max_branches_per_hop: int = 5,
    direction: str = "outgoing",
) -> BuiltGraph:
    graph = BuiltGraph()
    seen_nodes: dict[str, dict] = {}

    root = wallet_address.lower()
    seen_nodes[root] = {
        "id": wallet_address,
        "hop": 0,
        "risk_tag": "reported",
        "risk_score": 100,
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
                        "risk_score": 50,
                        "label": exchange["label"] if exchange else None,
                        "exchange_network": exchange["network"] if exchange else None,
                        "tx_count": 0,
                        "total_value_eth": 0.0,
                    }
                    node["risk_tag"] = classify_node(node, exchange_match=exchange)
                    seen_nodes[target_key] = node

                    if node["risk_tag"] == "exchange" and graph.flagged_exchange is None:
                        graph.flagged_exchange = node
                    else:
                        next_frontier.append(target)

                seen_nodes[target_key]["tx_count"] += 1
                seen_nodes[target_key]["total_value_eth"] += tx["value_eth"]

        frontier = next_frontier
        if not frontier:
            break

    graph.nodes = refine_intermediary_tags(list(seen_nodes.values()), graph.edges)
    graph.summary = build_summary(wallet_address, graph.nodes, graph.flagged_exchange, max_hops)
    return graph

