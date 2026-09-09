"""Per-wallet trust score (0-100), rule-based - no ML, no external calls.

Direction: **100 = most trustworthy / least suspicious behaviour observed,
0 = most suspicious.**

This is deliberately independent of `risk_tag`. A wallet tagged "exchange" is
a high-value finding for an investigator (it's where the money cashed out),
but being a known custodial VASP is not itself suspicious behaviour - so
exchange nodes are not penalised here. `risk_tag` answers "how important is
this node to the case"; `trust_score` answers "how suspicious does this
wallet's own behaviour look". Keeping them separate avoids the conflation
that made the old, unused `risk_score` field incoherent.

Inputs are the node/edge dicts `graph_builder.py` already produces plus the
findings from `pattern_analyzer.py`.
"""

import time
from collections import defaultdict

NEUTRAL_SCORE = 50
MAX_SCORE = 100
MIN_SCORE = 0

# Fan-out: a wallet spraying funds across many counterparties is a layering
# signal. Mirrors risk_engine's INTERMEDIARY_FANOUT_THRESHOLD reasoning.
FANOUT_PENALTY_THRESHOLD = 3
FANOUT_PENALTY_PER_EDGE = 6
FANOUT_PENALTY_MAX = 30

# Thin/fresh wallets carry less corroborating history - mildly suspicious,
# not damning (a legitimate new wallet looks the same).
NEW_WALLET_AGE_DAYS = 30
NEW_WALLET_PENALTY = 12
LOW_TX_COUNT_THRESHOLD = 5
LOW_TX_COUNT_PENALTY = 8

# Membership in a detected laundering pattern is the strongest signal here.
PATTERN_SEVERITY_PENALTY = {"low": 5, "medium": 15, "high": 30}

SECONDS_PER_DAY = 86400


def _wallet_age_days(txs: list[dict], now: float | None = None) -> float | None:
    """Days since this wallet's earliest known transaction, or None if unknown."""
    timestamps = [tx.get("timestamp") for tx in txs if tx.get("timestamp")]
    if not timestamps:
        return None
    now = now if now is not None else time.time()
    return max(0.0, (now - min(timestamps)) / SECONDS_PER_DAY)


def compute_trust_score(
    node: dict,
    edges: list[dict],
    node_txs: dict[str, list[dict]],
    pattern_findings: list[dict],
    now: float | None = None,
) -> int:
    """Score one wallet from 100 (clean) downward."""
    node_key = node["id"].lower()
    score = MAX_SCORE

    # 1. Fan-out
    outgoing = sum(1 for e in edges if e["source"].lower() == node_key)
    if outgoing >= FANOUT_PENALTY_THRESHOLD:
        excess = outgoing - FANOUT_PENALTY_THRESHOLD + 1
        score -= min(FANOUT_PENALTY_MAX, excess * FANOUT_PENALTY_PER_EDGE)

    # 2. Wallet history depth
    txs = node_txs.get(node_key, [])
    age_days = _wallet_age_days(txs, now=now)
    if age_days is not None and age_days < NEW_WALLET_AGE_DAYS:
        score -= NEW_WALLET_PENALTY
    if txs and len(txs) < LOW_TX_COUNT_THRESHOLD:
        score -= LOW_TX_COUNT_PENALTY

    # 3. Implicated in a detected laundering pattern
    for finding in pattern_findings:
        involved = {n.lower() for n in finding.get("node_ids", [])}
        if node_key in involved:
            score -= PATTERN_SEVERITY_PENALTY.get(finding.get("severity"), 0)

    return max(MIN_SCORE, min(MAX_SCORE, int(round(score))))


def _hops_to_nearest_exchange(nodes: list[dict], edges: list[dict]) -> dict[str, int]:
    """Shortest forward path length from each wallet to any exchange node.

    Surfaced as a standalone investigative stat rather than folded into the
    score - proximity to a cashout point says where the money went, not how
    suspicious the wallet itself is.
    """
    adjacency: dict[str, list[str]] = defaultdict(list)
    for edge in edges:
        adjacency[edge["source"].lower()].append(edge["target"].lower())

    exchange_keys = {n["id"].lower() for n in nodes if n.get("risk_tag") == "exchange"}
    if not exchange_keys:
        return {}

    # Reverse BFS out from every exchange node at once.
    reverse: dict[str, list[str]] = defaultdict(list)
    for source, targets in adjacency.items():
        for target in targets:
            reverse[target].append(source)

    distances: dict[str, int] = {key: 0 for key in exchange_keys}
    frontier = list(exchange_keys)
    depth = 0
    while frontier:
        depth += 1
        next_frontier = []
        for key in frontier:
            for predecessor in reverse.get(key, []):
                if predecessor not in distances:
                    distances[predecessor] = depth
                    next_frontier.append(predecessor)
        frontier = next_frontier

    return distances


def attach_trust_scores(
    nodes: list[dict],
    edges: list[dict],
    node_txs: dict[str, list[dict]],
    pattern_findings: list[dict],
    now: float | None = None,
) -> list[dict]:
    """Set `trust_score` (and `hops_to_nearest_exchange`) on every node."""
    distances = _hops_to_nearest_exchange(nodes, edges)

    for node in nodes:
        node["trust_score"] = compute_trust_score(
            node, edges, node_txs, pattern_findings, now=now
        )
        node["hops_to_nearest_exchange"] = distances.get(node["id"].lower())

    return nodes
