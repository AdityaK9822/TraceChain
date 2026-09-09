from app.core.attribution import (
    build_attribution_summary,
    find_deposit_address,
    tag_deposit_address,
)
from app.data.vasps import hot_wallet

CHAIN = "ethereum"
HOT = hot_wallet("binance", CHAIN)
DEPOSIT = "0x1111111111111111111111111111111111111111"
MULE = "0x2222222222222222222222222222222222222222"


def _nodes():
    return [
        {"id": MULE, "hop": 1, "risk_tag": "unknown"},
        {"id": DEPOSIT, "hop": 2, "risk_tag": "unknown"},
    ]


def _edges():
    return [{"source": MULE, "target": DEPOSIT, "value_eth": 10.0, "tx_hash": "0xa", "hop": 2}]


def _txs(sweep_value=9.9):
    return {
        DEPOSIT.lower(): [
            {"from": DEPOSIT, "to": HOT, "value_eth": sweep_value, "hash": "0xsweep", "timestamp": 100}
        ]
    }


def test_deposit_address_identified_from_sweep_into_hot_wallet():
    result = find_deposit_address(_nodes(), _edges(), _txs(), CHAIN)
    assert result is not None
    assert result["address"] == DEPOSIT
    assert result["vasp"]["name"] == "Binance"
    assert result["evidence_tx_hash"] == "0xsweep"


def test_no_deposit_address_when_nothing_reaches_a_vasp():
    txs = {DEPOSIT.lower(): [{"from": DEPOSIT, "to": MULE, "value_eth": 1.0, "hash": "0xb", "timestamp": 1}]}
    assert find_deposit_address(_nodes(), _edges(), txs, CHAIN) is None


def test_hot_wallet_itself_is_not_reported_as_a_deposit_address():
    nodes = _nodes() + [{"id": HOT, "hop": 3, "risk_tag": "exchange"}]
    txs = {**_txs(), HOT.lower(): [{"from": HOT, "to": MULE, "value_eth": 1.0, "hash": "0xc", "timestamp": 1}]}
    result = find_deposit_address(nodes, _edges(), txs, CHAIN)
    assert result["address"] == DEPOSIT


def test_sweeping_most_of_the_balance_scores_higher_confidence():
    full = find_deposit_address(_nodes(), _edges(), _txs(9.9), CHAIN)
    partial = find_deposit_address(_nodes(), _edges(), _txs(2.0), CHAIN)
    assert full["confidence"] > partial["confidence"]


def test_attribution_is_chain_scoped():
    # The same address on a chain where that VASP has no hot wallet.
    assert find_deposit_address(_nodes(), _edges(), _txs(), "solana") is None


def test_tagging_marks_the_node_and_labels_the_vasp():
    nodes = _nodes()
    deposit = find_deposit_address(nodes, _edges(), _txs(), CHAIN)
    tagged = tag_deposit_address(nodes, deposit)
    node = next(n for n in tagged if n["id"] == DEPOSIT)
    assert node["risk_tag"] == "deposit_address"
    assert "Binance" in node["label"]


def test_summary_names_the_address_and_the_kyc_route():
    deposit = find_deposit_address(_nodes(), _edges(), _txs(), CHAIN)
    summary = build_attribution_summary(deposit)
    assert DEPOSIT in summary
    assert "Binance" in summary
    assert "KYC" in summary


def test_summary_is_honest_when_nothing_was_attributed():
    assert "No exchange deposit address" in build_attribution_summary(None)
