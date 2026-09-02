"""Hop-by-hop BFS tracing of a wallet's outgoing fund flow.

Starting from the reported wallet, we follow outgoing transactions up to
`max_hops` deep. At each hop we cap the number of branches we follow
(`max_branches_per_hop`, ranked by transaction value) so the resulting graph
stays small enough to read on a screen during a demo. A branch that lands on
a known exchange wallet is flagged and not expanded further - the money has
left the traceable chain.
"""

from dataclasses import dataclass, field

from app.core import exchange_matcher
from app.core.blockchain_client import get_transactions
from app.core.risk_engine import build_summary, classify_node, refine_intermediary_tags


@dataclass
class BuiltGraph:
    nodes: list[dict] = field(default_factory=list)
    edges: list[dict] = field(default_factory=list)
    flagged_exchange: dict | None = None
    summary: str = ""


def trace_wallet(
    wallet_address: str,
    network: str,
    max_hops: int = 3,
    max_branches_per_hop: int = 5,
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

    for hop in range(1, max_hops + 1):
        next_frontier: list[str] = []

        for source in frontier:
            source_key = source.lower()
            if source_key in visited_as_source:
                continue
            visited_as_source.add(source_key)

            # An exchange deposit is a terminal node - funds are out of our
            # visibility once they hit a custodial wallet.
            if seen_nodes[source_key]["risk_tag"] == "exchange":
                continue

            try:
                txs = get_transactions(source, network=network)
            except Exception:
                continue

            outgoing = [tx for tx in txs if tx["from"].lower() == source_key]
            outgoing.sort(key=lambda tx: tx["value_eth"], reverse=True)
            top_txs = outgoing[:max_branches_per_hop]

            for tx in top_txs:
                target = tx["to"]
                target_key = target.lower()

                graph.edges.append(
                    {
                        "source": source,
                        "target": target,
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
