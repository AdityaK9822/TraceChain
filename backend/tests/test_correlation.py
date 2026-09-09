from app.core.correlation import correlate
from app.data.vasps import hot_wallet

CHAIN = "ethereum"
HOT = hot_wallet("binance", CHAIN)
SHARED_A = "0xaaaa111111111111111111111111111111111111"
SHARED_B = "0xbbbb222222222222222222222222222222222222"
DEPOSIT = "0xdddd333333333333333333333333333333333333"


def _node(address, hop, behavior="mule"):
    return {"id": address, "hop": hop, "risk_tag": "mule", "behavior": behavior}


def _historical_deposit():
    return {
        "address": DEPOSIT,
        "vasp": {
            "vasp_id": "binance",
            "name": "Binance",
            "jurisdiction": "Seychelles (global)",
            "kyc_contact": "LERS",
            "response_sla_days": 14,
            "hot_wallet": HOT,
        },
    }


def test_shared_wallets_are_detected():
    live = [_node("0xlive", 0), _node(SHARED_A, 1), _node(SHARED_B, 2)]
    hist = [_node("0xold", 0), _node(SHARED_A, 1), _node(SHARED_B, 3)]
    result = correlate(live, [], hist, [], _historical_deposit(), CHAIN, "case X")
    assert result["shared_count"] == 2
    assert {s["address"] for s in result["shared_wallets"]} == {SHARED_A, SHARED_B}


def test_prediction_comes_from_the_prior_case_deposit_address():
    live = [_node(SHARED_A, 1)]
    hist = [_node(SHARED_A, 1)]
    result = correlate(live, [], hist, [], _historical_deposit(), CHAIN, "case X")
    assert result["predicted_deposit_address"] == DEPOSIT
    assert result["predicted_vasp"]["name"] == "Binance"


def test_confidence_rises_with_more_reused_wallets():
    hist = [_node(SHARED_A, 1), _node(SHARED_B, 2)]
    one = correlate([_node(SHARED_A, 1)], [], hist, [], _historical_deposit(), CHAIN)
    two = correlate([_node(SHARED_A, 1), _node(SHARED_B, 2)], [], hist, [], _historical_deposit(), CHAIN)
    assert two["confidence"] > one["confidence"]


def test_reusing_the_deposit_address_raises_confidence_further():
    hist = [_node(SHARED_A, 1), _node(DEPOSIT, 4)]
    without = correlate([_node(SHARED_A, 1)], [], hist, [], _historical_deposit(), CHAIN)
    with_reuse = correlate(
        [_node(SHARED_A, 1), _node(DEPOSIT, 4)], [], hist, [], _historical_deposit(), CHAIN
    )
    assert with_reuse["deposit_address_reused"] is True
    assert with_reuse["confidence"] > without["confidence"]


def test_shared_exchange_hot_wallet_is_not_treated_as_evidence():
    """Every case cashing out at Binance shares its hot wallet - that says
    nothing about whether the same actor is behind both."""
    live = [_node("0xlive", 0), _node(HOT, 5)]
    hist = [_node("0xold", 0), _node(HOT, 5)]
    assert correlate(live, [], hist, [], _historical_deposit(), CHAIN) is None


def test_no_correlation_without_a_prior_case():
    assert correlate([_node(SHARED_A, 1)], [], [], [], None, CHAIN) is None


def test_prediction_is_available_at_the_earliest_reused_hop():
    live = [_node(SHARED_A, 1), _node(SHARED_B, 3)]
    hist = [_node(SHARED_A, 2), _node(SHARED_B, 2)]
    result = correlate(live, [], hist, [], _historical_deposit(), CHAIN)
    # Reuse is visible at hop 1, well before the deposit address at hop 4+.
    assert result["available_at_hop"] == 1


def test_rationale_mentions_the_prior_case_and_prediction():
    result = correlate(
        [_node(SHARED_A, 1)], [], [_node(SHARED_A, 1)], [], _historical_deposit(), CHAIN, "case eth-prior"
    )
    assert "case eth-prior" in result["rationale"]
    assert DEPOSIT in result["rationale"]
