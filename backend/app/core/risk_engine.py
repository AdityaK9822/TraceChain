"""v1 heuristic risk engine (rule-based - not ML).

Tags every non-root node as one of:
  - "exchange"      matched a known exchange/VASP wallet -> funds cashed out
  - "intermediary"  high fan-out (>=3 distinct outgoing counterparties seen
                     so far) - a common layering pattern to obscure the trail
  - "unknown"       passthrough node, not enough signal either way

This is intentionally simple for the hackathon demo. Real risk scoring
(clustering heuristics, mixer detection, ML) is roadmap, not v1.
"""

from typing import Optional

INTERMEDIARY_FANOUT_THRESHOLD = 3


def classify_node(node: dict, exchange_match: Optional[dict]) -> str:
    if node.get("hop", 0) == 0:
        return "reported"
    if exchange_match is not None:
        return "exchange"
    return "unknown"


def refine_intermediary_tags(nodes: list[dict], edges: list[dict]) -> list[dict]:
    """Second pass: promote "unknown" nodes with high fan-out to "intermediary".

    Called after the full graph is built, since fan-out isn't known until all
    of a node's outgoing edges have been collected.
    """
    outgoing_counts: dict[str, int] = {}
    for edge in edges:
        key = edge["source"].lower()
        outgoing_counts[key] = outgoing_counts.get(key, 0) + 1

    for node in nodes:
        if node["risk_tag"] != "unknown":
            continue
        if outgoing_counts.get(node["id"].lower(), 0) >= INTERMEDIARY_FANOUT_THRESHOLD:
            node["risk_tag"] = "intermediary"

    return nodes


def build_summary(
    wallet_address: str,
    nodes: list[dict],
    flagged_exchange: Optional[dict],
    max_hops: int,
) -> str:
    hop_count = max((n["hop"] for n in nodes), default=0)
    if flagged_exchange:
        return (
            f"Traced {wallet_address} across {hop_count} hop(s). Funds were deposited "
            f"into {flagged_exchange.get('label') or flagged_exchange['id']} "
            f"({flagged_exchange.get('exchange_network', 'unknown network')}) - "
            f"exchange deposit detected."
        )
    return (
        f"Traced {wallet_address} across {hop_count} hop(s) (max {max_hops} configured). "
        f"No known exchange deposit detected within the traced depth - funds may have "
        f"moved further, or the receiving wallet is not in the known-exchange list."
    )
