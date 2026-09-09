import time

from app.core.trust_score import attach_trust_scores, compute_trust_score

NOW = 1_700_000_000.0
OLD_TX_TS = int(NOW - 365 * 86400)  # ~1 year old wallet


def _node(node_id, risk_tag="unknown", hop=1):
    return {"id": node_id, "hop": hop, "risk_tag": risk_tag}


def _edge(source, target, tx_hash, value_eth=1.0):
    return {
        "source": source,
        "target": target,
        "tx_hash": tx_hash,
        "value_eth": value_eth,
        "timestamp": OLD_TX_TS,
        "hop": 1,
    }


def _established_history(address, count=20):
    return {address.lower(): [{"timestamp": OLD_TX_TS} for _ in range(count)]}


def test_clean_established_wallet_scores_high():
    node = _node("0xCLEAN")
    score = compute_trust_score(node, [], _established_history("0xCLEAN"), [], now=NOW)
    assert score == 100


def test_high_fanout_lowers_trust_score():
    node = _node("0xSPRAY")
    edges = [_edge("0xSPRAY", f"0xT{i}", f"0x{i}") for i in range(5)]
    score = compute_trust_score(node, edges, _established_history("0xSPRAY"), [], now=NOW)
    assert score < 100


def test_more_fanout_scores_lower_than_less_fanout():
    history = _established_history("0xSPRAY")
    few = compute_trust_score(
        _node("0xSPRAY"), [_edge("0xSPRAY", f"0xT{i}", f"0x{i}") for i in range(3)], history, [], now=NOW
    )
    many = compute_trust_score(
        _node("0xSPRAY"), [_edge("0xSPRAY", f"0xT{i}", f"0x{i}") for i in range(8)], history, [], now=NOW
    )
    assert many < few


def test_pattern_finding_membership_lowers_trust_score():
    node = _node("0xDIRTY")
    history = _established_history("0xDIRTY")
    findings = [
        {
            "pattern_type": "peel_chain",
            "severity": "high",
            "description": "…",
            "node_ids": ["0xDIRTY"],
            "edge_tx_hashes": [],
        }
    ]
    clean = compute_trust_score(node, [], history, [], now=NOW)
    dirty = compute_trust_score(node, [], history, findings, now=NOW)
    assert dirty == clean - 30


def test_higher_severity_penalises_more():
    node = _node("0xX")
    history = _established_history("0xX")

    def score_for(severity):
        return compute_trust_score(
            node,
            [],
            history,
            [{"pattern_type": "sweep", "severity": severity, "description": "…", "node_ids": ["0xX"]}],
            now=NOW,
        )

    assert score_for("high") < score_for("medium") < score_for("low")


def test_new_thin_wallet_is_penalised():
    node = _node("0xNEW")
    fresh = {"0xnew": [{"timestamp": int(NOW - 86400)}]}  # 1 day old, 1 tx
    score = compute_trust_score(node, [], fresh, [], now=NOW)
    assert score < 100


def test_score_clamped_to_0_100():
    node = _node("0xWORST")
    edges = [_edge("0xWORST", f"0xT{i}", f"0x{i}") for i in range(20)]
    findings = [
        {"pattern_type": "sweep", "severity": "high", "description": "…", "node_ids": ["0xWORST"]}
        for _ in range(10)
    ]
    fresh = {"0xworst": [{"timestamp": int(NOW - 3600)}]}
    score = compute_trust_score(node, edges, fresh, findings, now=NOW)
    assert 0 <= score <= 100


def test_exchange_node_is_not_penalised_for_being_an_exchange():
    """Being a known VASP is a finding for the case, not suspicious behaviour."""
    exchange = _node("0xEXCH", risk_tag="exchange")
    unknown = _node("0xUNKN", risk_tag="unknown")
    history = {**_established_history("0xEXCH"), **_established_history("0xUNKN")}
    assert compute_trust_score(exchange, [], history, [], now=NOW) == compute_trust_score(
        unknown, [], history, [], now=NOW
    )


def test_attach_trust_scores_sets_fields_on_every_node():
    nodes = [_node("0xROOT", risk_tag="reported", hop=0), _node("0xMID"), _node("0xEXCH", risk_tag="exchange", hop=2)]
    edges = [_edge("0xROOT", "0xMID", "0x1"), _edge("0xMID", "0xEXCH", "0x2")]
    history = {
        **_established_history("0xROOT"),
        **_established_history("0xMID"),
        **_established_history("0xEXCH"),
    }

    result = attach_trust_scores(nodes, edges, history, [], now=NOW)

    assert all("trust_score" in n for n in result)
    assert all(0 <= n["trust_score"] <= 100 for n in result)
    by_id = {n["id"]: n for n in result}
    assert by_id["0xEXCH"]["hops_to_nearest_exchange"] == 0
    assert by_id["0xMID"]["hops_to_nearest_exchange"] == 1
    assert by_id["0xROOT"]["hops_to_nearest_exchange"] == 2


def test_wallet_with_unknown_history_is_not_penalised_for_missing_data():
    """No tx data (e.g. a failed fetch) should not be treated as a fresh wallet."""
    node = _node("0xNODATA")
    score = compute_trust_score(node, [], {}, [], now=NOW)
    assert score == 100
