import asyncio
from unittest.mock import AsyncMock, patch

from app.core.graph_builder import trace_wallet_async

ROOT = "0xROOT0000000000000000000000000000000001"
EXCHANGE_A = "0xEXCHA000000000000000000000000000000002"
EXCHANGE_B = "0xEXCHB000000000000000000000000000000003"
PASSTHROUGH = "0xPASS0000000000000000000000000000000004"


def _tx(from_addr, to_addr, value_eth, ts, tx_hash):
    return {"from": from_addr, "to": to_addr, "value_eth": value_eth, "timestamp": ts, "hash": tx_hash}


def test_second_exchange_match_does_not_become_flagged_or_expand():
    """A second exchange node found in the same hop should still be terminal -
    excluded from the next frontier - even though it doesn't win the
    first-match `flagged_exchange` slot."""
    asyncio.run(_run_second_exchange_match_scenario())


async def _run_second_exchange_match_scenario():

    root_txs = [
        _tx(ROOT, EXCHANGE_A, 2.0, 100, "0xhash1"),
        _tx(ROOT, EXCHANGE_B, 1.0, 101, "0xhash2"),
    ]

    async def fake_get_transactions_async(address, network=None):
        if address.lower() == ROOT.lower():
            return root_txs
        # If either exchange node were (incorrectly) expanded, it would hit
        # this branch and return a further hop of transactions.
        return [_tx(address, PASSTHROUGH, 0.5, 200, "0xhash3")]

    exchange_records = {
        EXCHANGE_A.lower(): {"address": EXCHANGE_A, "label": "Exchange A", "network": "ethereum", "chain": "ethereum"},
        EXCHANGE_B.lower(): {"address": EXCHANGE_B, "label": "Exchange B", "network": "ethereum", "chain": "ethereum"},
    }

    def fake_match(address, network=None):
        return exchange_records.get(address.lower())

    with patch("app.core.graph_builder.get_transactions_async", new=AsyncMock(side_effect=fake_get_transactions_async)):
        with patch("app.core.graph_builder.exchange_matcher.match", side_effect=fake_match):
            graph = await trace_wallet_async(ROOT, network="ethereum", max_hops=3, max_branches_per_hop=5)

    assert graph.flagged_exchange is not None
    assert graph.flagged_exchange["id"] == EXCHANGE_A

    exchange_nodes = [n for n in graph.nodes if n["id"].lower() in (EXCHANGE_A.lower(), EXCHANGE_B.lower())]
    assert len(exchange_nodes) == 2
    assert all(n["risk_tag"] == "exchange" for n in exchange_nodes)

    # Neither exchange node should have been expanded - no hop-2 edges
    # originating from either of them, and no PASSTHROUGH node discovered.
    exchange_ids = {EXCHANGE_A.lower(), EXCHANGE_B.lower()}
    assert not any(e["source"].lower() in exchange_ids for e in graph.edges)
    assert not any(n["id"].lower() == PASSTHROUGH.lower() for n in graph.nodes)
