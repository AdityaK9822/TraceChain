"""Deterministic laundering-pattern detection over a traced fund-flow graph.

Surfaced to analysts as "AI-Assisted Analysis" in the UI, but this is plain
rule-based pattern matching over the graph's nodes/edges - no ML model and no
external API call is involved. See `risk_engine.py` for the per-node risk
tagging this complements, and `trust_score.py` for the numeric score that
consumes these findings.

Every detector operates on the same node/edge dict shapes `graph_builder.py`
already produces, so no additional chain data needs to be fetched.
"""

from collections import defaultdict
from typing import Any

from app.core.chains import UnknownChainError, chain_symbol, get_chain

# A wallet receiving from this many distinct sources inside the window looks
# like a collection/sweep address rather than an ordinary counterparty.
SWEEP_MIN_SOURCES = 3
SWEEP_TIME_WINDOW_SECONDS = 3600

# A peel chain forwards *most* of the balance onward at each hop, shaving a
# small amount off each time. Retention outside this band is either a normal
# full-value forward (>0.99) or a genuine split (<0.90).
PEEL_CHAIN_MIN_HOPS = 3
PEEL_CHAIN_RETENTION_MIN = 0.90
PEEL_CHAIN_RETENTION_MAX = 0.99

# Structuring: several near-identical transfers fired off close together.
STRUCTURING_MIN_TRANSFERS = 3
STRUCTURING_VALUE_TOLERANCE = 0.05  # +/- 5% of the group mean
STRUCTURING_TIME_WINDOW_SECONDS = 1800

# Suspiciously "clean" amounts - a human picking a round number rather than
# sweeping a real balance.
ROUND_NUMBER_STEP = 0.5
ROUND_NUMBER_MIN_VALUE = 0.1
ROUND_NUMBER_EPSILON = 1e-9
# Cap emitted round-number findings so a large graph can't drown the panel -
# same "keep the demo legible" philosophy as graph_builder's branch cap.
ROUND_NUMBER_MAX_FINDINGS = 20


def _finding(pattern_type: str, severity: str, description: str, node_ids: list, edge_tx_hashes: list) -> dict:
    return {
        "pattern_type": pattern_type,
        "severity": severity,
        "description": description,
        "node_ids": node_ids,
        "edge_tx_hashes": edge_tx_hashes,
    }


def _cluster_by_time(items: list[dict], window_seconds: int) -> list[list[dict]]:
    """Group items (dicts carrying a `timestamp`) into runs where each item is
    within `window_seconds` of the previous one."""
    if not items:
        return []
    ordered = sorted(items, key=lambda i: i.get("timestamp", 0))
    clusters = [[ordered[0]]]
    for item in ordered[1:]:
        previous = clusters[-1][-1]
        if item.get("timestamp", 0) - previous.get("timestamp", 0) <= window_seconds:
            clusters[-1].append(item)
        else:
            clusters.append([item])
    return clusters


def detect_sweep_patterns(nodes: list[dict], edges: list[dict], symbol: str = "ETH") -> list[dict]:
    """Multiple distinct wallets funnelling into one address in a tight window."""
    by_target: dict[str, list[dict]] = defaultdict(list)
    for edge in edges:
        by_target[edge["target"].lower()].append(edge)

    findings: list[dict] = []
    for target_key, target_edges in by_target.items():
        for cluster in _cluster_by_time(target_edges, SWEEP_TIME_WINDOW_SECONDS):
            sources = {e["source"] for e in cluster}
            if len(sources) < SWEEP_MIN_SOURCES:
                continue
            target_id = cluster[0]["target"]
            total = sum(e.get("value_eth", 0.0) for e in cluster)
            findings.append(
                _finding(
                    "sweep",
                    "high" if len(sources) >= SWEEP_MIN_SOURCES + 2 else "medium",
                    f"{len(sources)} distinct wallets sent {total:.4f} {symbol} into this address "
                    f"within {SWEEP_TIME_WINDOW_SECONDS // 60} minutes - consistent with a "
                    f"collection/sweep address consolidating proceeds.",
                    [target_id, *sorted(sources)],
                    [e["tx_hash"] for e in cluster],
                )
            )
    return findings


def detect_peel_chain_patterns(nodes: list[dict], edges: list[dict]) -> list[dict]:
    """A chain of hops each forwarding most-but-not-all of what it received."""
    # The dominant outgoing edge per wallet is the "onward" leg of a peel chain;
    # the residual is what gets peeled off.
    largest_outgoing: dict[str, dict] = {}
    for edge in edges:
        key = edge["source"].lower()
        current = largest_outgoing.get(key)
        if current is None or edge.get("value_eth", 0.0) > current.get("value_eth", 0.0):
            largest_outgoing[key] = edge

    incoming_value: dict[str, float] = defaultdict(float)
    for edge in edges:
        incoming_value[edge["target"].lower()] += edge.get("value_eth", 0.0)

    findings: list[dict] = []
    consumed: set[str] = set()

    for edge in edges:
        start_key = edge["target"].lower()
        if start_key in consumed:
            continue

        chain_nodes: list[str] = []
        chain_hashes: list[str] = []
        cursor = start_key

        while True:
            onward = largest_outgoing.get(cursor)
            received = incoming_value.get(cursor, 0.0)
            if onward is None or received <= 0:
                break
            retention = onward.get("value_eth", 0.0) / received
            if not (PEEL_CHAIN_RETENTION_MIN <= retention <= PEEL_CHAIN_RETENTION_MAX):
                break
            chain_nodes.append(onward["source"])
            chain_hashes.append(onward["tx_hash"])
            consumed.add(cursor)
            cursor = onward["target"].lower()
            if cursor in consumed:
                break

        if len(chain_nodes) >= PEEL_CHAIN_MIN_HOPS:
            findings.append(
                _finding(
                    "peel_chain",
                    "high",
                    f"Chain of {len(chain_nodes)} wallets each forwarded "
                    f"{int(PEEL_CHAIN_RETENTION_MIN * 100)}-{int(PEEL_CHAIN_RETENTION_MAX * 100)}% "
                    f"of the value received, peeling off a small residual at each hop - "
                    f"a classic layering pattern used to obscure the trail.",
                    chain_nodes,
                    chain_hashes,
                )
            )
    return findings


def detect_structuring_patterns(nodes: list[dict], edges: list[dict], symbol: str = "ETH") -> list[dict]:
    """Several near-identical-value transfers from one wallet in quick succession."""
    by_source: dict[str, list[dict]] = defaultdict(list)
    for edge in edges:
        by_source[edge["source"].lower()].append(edge)

    findings: list[dict] = []
    for source_key, source_edges in by_source.items():
        for cluster in _cluster_by_time(source_edges, STRUCTURING_TIME_WINDOW_SECONDS):
            if len(cluster) < STRUCTURING_MIN_TRANSFERS:
                continue
            values = [e.get("value_eth", 0.0) for e in cluster]
            mean = sum(values) / len(values)
            if mean <= 0:
                continue
            if any(abs(v - mean) / mean > STRUCTURING_VALUE_TOLERANCE for v in values):
                continue
            findings.append(
                _finding(
                    "structuring",
                    "medium",
                    f"{len(cluster)} transfers of ~{mean:.4f} {symbol} each left this wallet within "
                    f"{STRUCTURING_TIME_WINDOW_SECONDS // 60} minutes - near-identical amounts "
                    f"fired in rapid succession suggest automated structuring rather than "
                    f"organic activity.",
                    [cluster[0]["source"], *{e["target"] for e in cluster}],
                    [e["tx_hash"] for e in cluster],
                )
            )
    return findings


def detect_round_number_transfers(
    edges: list[dict], chain: str | None = None, symbol: str = "ETH"
) -> list[dict]:
    """Transfers of suspiciously exact round amounts.

    What counts as "round" is chain-relative: 0.5 ETH and 500 USDT are both
    round numbers, so the thresholds come from the chain registry. Defaults to
    the Ethereum-scale constants above when no chain is given.
    """
    step, minimum = ROUND_NUMBER_STEP, ROUND_NUMBER_MIN_VALUE
    if chain:
        try:
            config = get_chain(chain)
            step, minimum = config["round_step"], config["min_round_value"]
        except UnknownChainError:
            pass

    candidates = []
    for edge in edges:
        value = edge.get("value_eth", 0.0)
        if value < minimum:
            continue
        remainder = value % step
        if remainder <= ROUND_NUMBER_EPSILON or abs(remainder - step) <= ROUND_NUMBER_EPSILON:
            candidates.append(edge)

    candidates.sort(key=lambda e: e.get("value_eth", 0.0), reverse=True)

    return [
        _finding(
            "round_number",
            "low",
            f"Transfer of exactly {edge['value_eth']:.4f} {symbol} - round amounts are chosen by a "
            f"person rather than produced by sweeping a real balance.",
            [edge["source"], edge["target"]],
            [edge["tx_hash"]],
        )
        for edge in candidates[:ROUND_NUMBER_MAX_FINDINGS]
    ]


def analyze_patterns(
    nodes: list[dict], edges: list[dict], chain: str | None = None
) -> list[dict[str, Any]]:
    """Run every detector and return the aggregated findings."""
    symbol = chain_symbol(chain) if chain else "ETH"
    return [
        *detect_sweep_patterns(nodes, edges, symbol=symbol),
        *detect_peel_chain_patterns(nodes, edges),
        *detect_structuring_patterns(nodes, edges, symbol=symbol),
        *detect_round_number_transfers(edges, chain=chain, symbol=symbol),
    ]
