"""Links a live trace to the same actor's earlier laundering path.

Fraud rings reuse infrastructure. When the wallets moving today's stolen
funds also appear in a case we traced months ago, the earlier case already
tells us where this money is heading - so the deposit address can be named
*before* the funds arrive there, rather than after.

Two graphs go in (the live trace and the actor's prior trace) and the overlap
between them comes out, along with the deposit address the prior case ended
on and how much confidence the overlap justifies.

Exchange hot wallets are deliberately excluded from the overlap: every case
cashing out at Binance shares Binance's hot wallet, which says nothing about
whether the same person is behind them. Only reused *fraud-controlled*
wallets count as evidence.
"""

from typing import Any

from app.data.vasps import match_hot_wallet

# Confidence bands by how many fraud-controlled wallets are reused.
CONFIDENCE_BY_OVERLAP = {0: 0.0, 1: 0.55, 2: 0.72, 3: 0.86}
CONFIDENCE_MAX = 0.94
DEPOSIT_REUSE_BONUS = 0.05


def correlate(
    live_nodes: list[dict],
    live_edges: list[dict],
    historical_nodes: list[dict],
    historical_edges: list[dict],
    historical_deposit: dict[str, Any] | None,
    chain: str,
    prior_case_label: str | None = None,
) -> dict[str, Any] | None:
    """Compare two traces and predict this case's deposit address."""
    if not historical_nodes:
        return None

    live_index = {n["id"].lower(): n for n in live_nodes}
    historical_index = {n["id"].lower(): n for n in historical_nodes}

    shared_keys = [
        key
        for key in live_index.keys() & historical_index.keys()
        # A shared hot wallet is not evidence of a shared operator.
        if not match_hot_wallet(key, chain)
    ]
    if not shared_keys:
        return None

    shared = [
        {
            "address": live_index[key]["id"],
            "live_hop": live_index[key].get("hop"),
            "historical_hop": historical_index[key].get("hop"),
            "behavior": live_index[key].get("behavior"),
        }
        for key in shared_keys
    ]
    shared.sort(key=lambda s: s["live_hop"] if s["live_hop"] is not None else 99)

    predicted = historical_deposit["address"] if historical_deposit else None
    deposit_reused = bool(predicted and predicted.lower() in live_index)

    confidence = CONFIDENCE_BY_OVERLAP.get(len(shared), CONFIDENCE_MAX)
    if deposit_reused:
        confidence = min(CONFIDENCE_MAX, confidence + DEPOSIT_REUSE_BONUS)

    # The earliest hop at which reuse becomes visible - i.e. the point in the
    # live trace where this prediction genuinely becomes available.
    available_at_hop = min(
        (s["live_hop"] for s in shared if s["live_hop"] is not None), default=None
    )

    reused_label = ", ".join(s["address"][:10] + "…" for s in shared[:3])
    rationale = (
        f"{len(shared)} wallet(s) moving these funds also appear in "
        f"{prior_case_label or 'an earlier traced case'} ({reused_label}). "
    )
    if predicted:
        rationale += (
            f"That case cashed out through deposit address {predicted}, so this "
            f"batch is expected to land there too."
        )
    else:
        rationale += "The earlier case did not reach a deposit address."

    return {
        "prior_case_label": prior_case_label,
        "shared_wallets": shared,
        "shared_count": len(shared),
        "deposit_address_reused": deposit_reused,
        "predicted_deposit_address": predicted,
        "predicted_vasp": historical_deposit["vasp"] if historical_deposit else None,
        "confidence": round(confidence, 2),
        "available_at_hop": available_at_hop,
        "rationale": rationale,
    }
