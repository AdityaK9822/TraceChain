"""Deposit-address attribution - the answer an investigator actually needs.

Real laundering does not end on an exchange's public hot wallet. It ends on a
**deposit address**: a unique, unlabelled address the exchange issued to one
specific account holder. Funds sit there briefly and are then swept into the
exchange's hot wallet along with everyone else's.

That sweep is the tell. If address X later moves funds into a known VASP hot
wallet, X is that VASP's deposit address - and because the exchange issued it
to a single KYC'd customer, X is precisely the address to name in a request
to the VASP for subscriber details.

We look for the sweep in each wallet's own transaction history rather than
only in the traced graph, so attribution still works when the traversal stops
at the deposit address without walking the final hop.
"""

from typing import Any

from app.data.vasps import match_hot_wallet


def find_deposit_address(
    nodes: list[dict],
    edges: list[dict],
    node_txs: dict[str, list[dict]],
    chain: str,
) -> dict[str, Any] | None:
    """Identify the deposit address in a traced graph and the VASP behind it.

    Returns {address, hop, vasp, evidence_tx_hash, swept_value, confidence}
    or None when no traced wallet sweeps into a known exchange.
    """
    candidates: list[dict[str, Any]] = []

    for node in nodes:
        key = node["id"].lower()
        # A hot wallet is the exchange itself, not a customer deposit address.
        if match_hot_wallet(node["id"], chain):
            continue

        for tx in node_txs.get(key, []):
            recipient = tx.get("to")
            if not recipient or (tx.get("from") or "").lower() != key:
                continue
            vasp = match_hot_wallet(recipient, chain)
            if vasp is None:
                continue

            received = sum(e.get("value_eth", 0.0) for e in edges if e["target"].lower() == key)
            swept = tx.get("value_eth", 0.0)
            # Sweeping out most of what came in is the classic deposit-address
            # signature; a partial move is weaker evidence.
            ratio = (swept / received) if received > 0 else 0.0
            confidence = 0.95 if ratio >= 0.9 else 0.8 if ratio >= 0.5 else 0.6

            candidates.append(
                {
                    "address": node["id"],
                    "hop": node.get("hop"),
                    "vasp": {
                        "vasp_id": vasp["vasp_id"],
                        "name": vasp["name"],
                        "jurisdiction": vasp["jurisdiction"],
                        "kyc_contact": vasp["kyc_contact"],
                        "response_sla_days": vasp["response_sla_days"],
                        "hot_wallet": vasp["hot_wallet"],
                    },
                    "evidence_tx_hash": tx.get("hash"),
                    "swept_value": swept,
                    "confidence": confidence,
                }
            )

    if not candidates:
        return None

    # Deepest hop wins: that is the end of the laundering chain.
    candidates.sort(key=lambda c: (c["confidence"], c["hop"] or 0), reverse=True)
    return candidates[0]


def tag_deposit_address(nodes: list[dict], deposit: dict[str, Any] | None) -> list[dict]:
    """Re-tag the identified deposit address so the UI can single it out."""
    if not deposit:
        return nodes
    key = deposit["address"].lower()
    for node in nodes:
        if node["id"].lower() == key:
            node["risk_tag"] = "deposit_address"
            node["label"] = f"{deposit['vasp']['name']} deposit address"
    return nodes


def build_attribution_summary(deposit: dict[str, Any] | None) -> str:
    if not deposit:
        return (
            "No exchange deposit address identified within the traced depth. "
            "Funds may still be moving, or the cash-out point is not covered by "
            "the VASP reference list."
        )
    vasp = deposit["vasp"]
    return (
        f"Deposit address found: {deposit['address']}. Funds were swept from this "
        f"address into {vasp['name']}'s hot wallet, identifying it as a "
        f"{vasp['name']} customer deposit address ({vasp['jurisdiction']}). "
        f"Serve a KYC/subscriber request via {vasp['kyc_contact']} to identify the "
        f"account holder."
    )
