from app.core.risk_engine import build_summary, classify_node, refine_intermediary_tags


def test_root_node_is_reported():
    assert classify_node({"hop": 0}, exchange_match=None) == "reported"


def test_matched_exchange_wins():
    node = {"hop": 1}
    match = {"label": "Binance Hot Wallet", "network": "mainnet"}
    assert classify_node(node, exchange_match=match) == "exchange"


def test_unmatched_node_is_unknown():
    assert classify_node({"hop": 2}, exchange_match=None) == "unknown"


def test_high_fanout_promotes_to_intermediary():
    nodes = [
        {"id": "0xA", "hop": 1, "risk_tag": "unknown"},
        {"id": "0xB", "hop": 2, "risk_tag": "unknown"},
    ]
    edges = [
        {"source": "0xA", "target": "0xB"},
        {"source": "0xA", "target": "0xC"},
        {"source": "0xA", "target": "0xD"},
    ]
    result = refine_intermediary_tags(nodes, edges)
    assert result[0]["risk_tag"] == "intermediary"
    assert result[1]["risk_tag"] == "unknown"


def test_summary_mentions_exchange_when_flagged():
    summary = build_summary(
        "0xROOT",
        nodes=[{"hop": 0}, {"hop": 1}],
        flagged_exchange={"label": "Binance Hot Wallet", "id": "0xEXCH", "exchange_network": "mainnet"},
        max_hops=3,
    )
    assert "Binance Hot Wallet" in summary
