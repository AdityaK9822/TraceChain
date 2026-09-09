"""Classifies what a wallet is *behaving* like, from its own history.

This is the second engine that runs alongside the traversal: for every wallet
the trace discovers, it reads that wallet's transaction history and decides
whether it looks like a real person's wallet or a laundering mule. The
distinction matters operationally - a mule is infrastructure, while a genuine
counterparty may be an unrelated merchant who simply received funds, and
should not be pursued as a suspect.

Rule-based and deterministic; no ML model or external call. The signals are
the ones an analyst would actually cite:

  mule      - fresh wallet, almost no history, forwards nearly everything it
              receives onward, appears inside a detected sweep/peel pattern
  personal  - long-lived, steady two-way activity with many counterparties,
              retains a balance rather than passing funds straight through
  vasp      - a known exchange hot wallet
  deposit   - the fraudster's deposit address at a VASP
  service   - very high throughput, but not a wallet we can attribute
"""

import time
from typing import Any

DAY = 86400

FORWARD_RATIO_MULE = 0.85          # passes on ~everything it receives
YOUNG_WALLET_DAYS = 60
THIN_HISTORY_TX_COUNT = 8
ESTABLISHED_WALLET_DAYS = 180
RICH_HISTORY_TX_COUNT = 10
DIVERSE_COUNTERPARTIES = 6
SERVICE_TX_COUNT = 30

LAUNDERING_PATTERNS = {"sweep", "peel_chain", "structuring"}


def _age_days(txs: list[dict], now: float) -> float | None:
    stamps = [t.get("timestamp") for t in txs if t.get("timestamp")]
    if not stamps:
        return None
    return max(0.0, (now - min(stamps)) / DAY)


def _counterparties(address_key: str, txs: list[dict]) -> set[str]:
    others: set[str] = set()
    for tx in txs:
        for side in ("from", "to"):
            value = tx.get(side)
            if value and value.lower() != address_key:
                others.add(value.lower())
    return others


def profile_wallet(
    node: dict,
    edges: list[dict],
    txs: list[dict],
    pattern_findings: list[dict],
    now: float | None = None,
) -> dict[str, Any]:
    """Return {'behavior', 'label', 'reasons'} for one wallet."""
    now = now if now is not None else time.time()
    key = node["id"].lower()

    if node.get("risk_tag") == "exchange":
        return {
            "behavior": "vasp",
            "label": "Exchange hot wallet",
            "reasons": ["Address is a known VASP hot wallet."],
        }
    if node.get("risk_tag") == "deposit_address":
        return {
            "behavior": "deposit",
            "label": "Exchange deposit address",
            "reasons": ["Funds swept from here into a known exchange hot wallet."],
        }

    received = sum(e.get("value_eth", 0.0) for e in edges if e["target"].lower() == key)
    sent = sum(e.get("value_eth", 0.0) for e in edges if e["source"].lower() == key)
    forward_ratio = (sent / received) if received > 0 else 0.0

    age = _age_days(txs, now)
    tx_count = len(txs)
    counterparties = len(_counterparties(key, txs))
    implicated = [
        f["pattern_type"]
        for f in pattern_findings
        if f.get("pattern_type") in LAUNDERING_PATTERNS
        and key in {n.lower() for n in f.get("node_ids", [])}
    ]

    mule_score = 0
    personal_score = 0
    reasons: list[str] = []

    if forward_ratio >= FORWARD_RATIO_MULE:
        mule_score += 2
        reasons.append(f"Forwarded {forward_ratio * 100:.0f}% of everything it received.")
    elif received > 0 and forward_ratio < 0.5:
        personal_score += 1
        reasons.append(f"Retained {(1 - forward_ratio) * 100:.0f}% of funds received.")

    if age is not None and age < YOUNG_WALLET_DAYS:
        mule_score += 1
        reasons.append(f"Wallet is only {age:.0f} days old.")
    elif age is not None and age >= ESTABLISHED_WALLET_DAYS:
        personal_score += 2
        reasons.append(f"Established wallet, active for {age / 365:.1f} years.")

    if tx_count and tx_count < THIN_HISTORY_TX_COUNT:
        mule_score += 1
        reasons.append(f"Only {tx_count} transactions in its entire history.")
    elif tx_count >= RICH_HISTORY_TX_COUNT:
        personal_score += 1
        reasons.append(f"{tx_count} transactions of ordinary activity.")

    if counterparties >= DIVERSE_COUNTERPARTIES:
        personal_score += 1
        reasons.append(f"Deals with {counterparties} distinct counterparties.")

    if implicated:
        mule_score += 2
        reasons.append(f"Appears inside a detected {implicated[0].replace('_', ' ')} pattern.")

    if tx_count >= SERVICE_TX_COUNT and forward_ratio < FORWARD_RATIO_MULE:
        return {
            "behavior": "service",
            "label": "High-throughput service",
            "reasons": reasons or [f"{tx_count} transactions, service-like volume."],
        }

    if mule_score > personal_score:
        behavior, label = "mule", "Laundering mule"
    elif personal_score > mule_score:
        behavior, label = "personal", "Genuine personal wallet"
    else:
        behavior, label = "unclear", "Insufficient signal"

    return {"behavior": behavior, "label": label, "reasons": reasons}


def attach_wallet_profiles(
    nodes: list[dict],
    edges: list[dict],
    node_txs: dict[str, list[dict]],
    pattern_findings: list[dict],
    now: float | None = None,
) -> list[dict]:
    """Set `behavior`, `behavior_label` and `behavior_reasons` on every node."""
    for node in nodes:
        profile = profile_wallet(
            node, edges, node_txs.get(node["id"].lower(), []), pattern_findings, now=now
        )
        node["behavior"] = profile["behavior"]
        node["behavior_label"] = profile["label"]
        node["behavior_reasons"] = profile["reasons"]
    return nodes
