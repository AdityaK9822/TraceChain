from app.core.pattern_analyzer import (
    analyze_patterns,
    detect_peel_chain_patterns,
    detect_round_number_transfers,
    detect_structuring_patterns,
    detect_sweep_patterns,
)


def _edge(source, target, value_eth, timestamp, tx_hash):
    return {
        "source": source,
        "target": target,
        "value_eth": value_eth,
        "timestamp": timestamp,
        "tx_hash": tx_hash,
        "hop": 1,
    }


def test_sweep_detected_for_converging_sources_in_window():
    edges = [
        _edge("0xA", "0xSINK", 1.11, 1000, "0x1"),
        _edge("0xB", "0xSINK", 2.22, 1200, "0x2"),
        _edge("0xC", "0xSINK", 3.33, 1400, "0x3"),
    ]
    findings = detect_sweep_patterns([], edges)
    assert len(findings) == 1
    assert findings[0]["pattern_type"] == "sweep"
    assert "0xSINK" in findings[0]["node_ids"]
    assert set(findings[0]["edge_tx_hashes"]) == {"0x1", "0x2", "0x3"}


def test_no_sweep_when_sources_below_threshold():
    edges = [
        _edge("0xA", "0xSINK", 1.11, 1000, "0x1"),
        _edge("0xB", "0xSINK", 2.22, 1200, "0x2"),
    ]
    assert detect_sweep_patterns([], edges) == []


def test_no_sweep_when_transfers_outside_time_window():
    edges = [
        _edge("0xA", "0xSINK", 1.11, 1000, "0x1"),
        _edge("0xB", "0xSINK", 2.22, 100_000, "0x2"),
        _edge("0xC", "0xSINK", 3.33, 200_000, "0x3"),
    ]
    assert detect_sweep_patterns([], edges) == []


def test_peel_chain_detected_for_declining_retention_chain():
    # Each wallet forwards ~95% of what it received onward.
    edges = [
        _edge("0xROOT", "0xP1", 10.0, 1000, "0x1"),
        _edge("0xP1", "0xP2", 9.5, 2000, "0x2"),
        _edge("0xP2", "0xP3", 9.0, 3000, "0x3"),
        _edge("0xP3", "0xP4", 8.6, 4000, "0x4"),
    ]
    findings = detect_peel_chain_patterns([], edges)
    assert len(findings) == 1
    assert findings[0]["pattern_type"] == "peel_chain"
    assert findings[0]["node_ids"] == ["0xP1", "0xP2", "0xP3"]


def test_no_peel_chain_when_retention_out_of_band():
    # Half the value is forwarded at each hop - a split, not a peel.
    edges = [
        _edge("0xROOT", "0xP1", 10.0, 1000, "0x1"),
        _edge("0xP1", "0xP2", 5.0, 2000, "0x2"),
        _edge("0xP2", "0xP3", 2.5, 3000, "0x3"),
        _edge("0xP3", "0xP4", 1.25, 4000, "0x4"),
    ]
    assert detect_peel_chain_patterns([], edges) == []


def test_structuring_detected_for_similar_value_rapid_transfers():
    edges = [
        _edge("0xSRC", "0xA", 1.00, 1000, "0x1"),
        _edge("0xSRC", "0xB", 1.01, 1100, "0x2"),
        _edge("0xSRC", "0xC", 0.99, 1200, "0x3"),
    ]
    findings = detect_structuring_patterns([], edges)
    assert len(findings) == 1
    assert findings[0]["pattern_type"] == "structuring"
    assert findings[0]["severity"] == "medium"


def test_no_structuring_when_values_differ_widely():
    edges = [
        _edge("0xSRC", "0xA", 1.00, 1000, "0x1"),
        _edge("0xSRC", "0xB", 8.00, 1100, "0x2"),
        _edge("0xSRC", "0xC", 0.20, 1200, "0x3"),
    ]
    assert detect_structuring_patterns([], edges) == []


def test_round_number_transfer_flagged():
    edges = [
        _edge("0xA", "0xB", 1.0, 1000, "0x1"),
        _edge("0xA", "0xC", 2.5, 1100, "0x2"),
        _edge("0xA", "0xD", 0.7314159, 1200, "0x3"),
    ]
    findings = detect_round_number_transfers(edges)
    flagged_hashes = {f["edge_tx_hashes"][0] for f in findings}
    assert flagged_hashes == {"0x1", "0x2"}
    assert all(f["pattern_type"] == "round_number" for f in findings)


def test_round_number_ignores_dust_below_minimum():
    edges = [_edge("0xA", "0xB", 0.05, 1000, "0x1")]
    assert detect_round_number_transfers(edges) == []


def test_analyze_patterns_aggregates_all_detectors():
    edges = [
        # sweep into 0xSINK
        _edge("0xA", "0xSINK", 1.11, 1000, "0x1"),
        _edge("0xB", "0xSINK", 2.22, 1200, "0x2"),
        _edge("0xC", "0xSINK", 3.33, 1400, "0x3"),
        # round number
        _edge("0xD", "0xE", 2.0, 5000, "0x4"),
    ]
    findings = analyze_patterns([], edges)
    types = {f["pattern_type"] for f in findings}
    assert "sweep" in types
    assert "round_number" in types
    assert all({"pattern_type", "severity", "description", "node_ids", "edge_tx_hashes"} <= set(f) for f in findings)
