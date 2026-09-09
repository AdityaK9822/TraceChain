"""Builds the synthetic transaction ledger the whole backend runs on.

This replaces Etherscan. Scenarios (data/scenarios.py) are expanded here into
concrete transactions, deliberately shaped so the real detectors in
core/pattern_analyzer.py actually fire on them:

  reported --structuring--> mules --sweep--> collector --peel chain-->
  deposit address --> VASP hot wallet

Wallets also get background history: "personal" wallets get years of varied
activity so they score as genuine, while mules and peel hops get only the
laundering transactions, so they read as fresh and single-purpose. That
contrast is what lets the wallet profiler tell them apart.

Timestamps are anchored to build time, so a scenario tagged `hours_ago: 6`
always reads as six hours old no matter when the demo runs.

`value_eth` carries the amount in the chain's own native units (ETH, BTC,
USDT, ...) - the field name is legacy, see core/chains.py for the symbol to
display.
"""

import time
from functools import lru_cache

from app.core.chains import get_chain
from app.data.addresses import synth_address, synth_tx_hash
from app.data.scenarios import SCENARIOS, resolve_role
from app.data.vasps import hot_wallet

HOUR = 3600
DAY = 86400

# Value retained at each stage of the laundering path.
MULE_FORWARD_RATIO = 0.97
PEEL_RATIOS = [0.95, 0.96]      # collector -> peel-2 -> deposit
DEPOSIT_SWEEP_RATIO = 0.99      # deposit address -> VASP hot wallet

PERSONAL_HISTORY_TX_COUNT = 14
PERSONAL_HISTORY_SPAN_DAYS = 700
VASP_HISTORY_TX_COUNT = 40


def _tx(sender: str, recipient: str, value: float, timestamp: int, label: str, chain: str) -> dict:
    return {
        "from": sender,
        "to": recipient,
        "hash": synth_tx_hash(chain, label),
        "value_eth": round(value, 8),
        "timestamp": int(timestamp),
    }


def _scenario_transactions(scenario: dict, now: float) -> list[dict]:
    chain = scenario["chain"]
    slug = scenario["slug"]
    config = get_chain(chain)
    base = int(now - scenario["hours_ago"] * HOUR)
    amount = scenario["amount"]

    role = lambda name: resolve_role(chain, slug, name)  # noqa: E731

    reported = role("reported")
    mules = [role(m) for m in scenario["mules"]]
    # The first peel hop doubles as the collector the mules sweep into.
    peel = [role(p) for p in scenario["peel"]]
    collector = peel[0]
    deposit = role(scenario["deposit"])
    vasp_hot = hot_wallet(scenario["vasp_id"], chain)

    txs: list[dict] = []

    # Stage 0 - the victim's payment into the reported wallet.
    victim = synth_address(chain, f"{slug}:victim")
    txs.append(_tx(victim, reported, amount, base - 2 * HOUR, f"{slug}:victim-in", chain))

    # Stage 1 - structuring: near-identical splits fired off in quick succession.
    share = amount / len(mules)
    jitter = [1.0, 0.985, 1.012]
    mule_received = []
    for index, mule in enumerate(mules):
        value = share * jitter[index % len(jitter)]
        mule_received.append(value)
        txs.append(_tx(reported, mule, value, base + index * 180, f"{slug}:split-{index}", chain))

    # Stage 2 - a mule pays a genuine counterparty a round amount. Gives the
    # graph a legitimate wallet to contrast against, and trips round-number.
    for index, personal_role in enumerate(scenario.get("personal", [])):
        personal = role(personal_role)
        txs.append(
            _tx(mules[0], personal, config["round_step"], base + 2400 + index * 300,
                f"{slug}:personal-{index}", chain)
        )

    # Stage 3 - sweep: every mule funnels into the collector inside one window.
    swept_total = 0.0
    for index, mule in enumerate(mules):
        value = mule_received[index] * MULE_FORWARD_RATIO
        swept_total += value
        txs.append(
            _tx(mule, collector, value, base + 1800 + index * 100, f"{slug}:sweep-{index}", chain)
        )

    # Stage 4 - peel chain: each hop forwards most of the balance onward.
    carried = swept_total
    hops = peel[1:] + [deposit]
    for index, target in enumerate(hops):
        ratio = PEEL_RATIOS[index] if index < len(PEEL_RATIOS) else PEEL_RATIOS[-1]
        carried *= ratio
        txs.append(
            _tx(peel[index], target, carried, base + (index + 2) * 2 * HOUR,
                f"{slug}:peel-{index}", chain)
        )

    # Stage 5 - the deposit address sweeps into the VASP hot wallet. This edge
    # is the evidence that attributes the deposit address to the exchange.
    txs.append(
        _tx(deposit, vasp_hot, carried * DEPOSIT_SWEEP_RATIO, base + 8 * HOUR,
            f"{slug}:vasp-sweep", chain)
    )

    return txs


def _background_history(scenario: dict, now: float) -> list[dict]:
    """Long, varied activity for genuine wallets; heavy volume for VASPs."""
    chain = scenario["chain"]
    slug = scenario["slug"]
    config = get_chain(chain)
    unit = config["round_step"]
    txs: list[dict] = []

    for personal_role in scenario.get("personal", []):
        personal = resolve_role(chain, slug, personal_role)
        for index in range(PERSONAL_HISTORY_TX_COUNT):
            counterparty = synth_address(chain, f"{slug}:{personal_role}:cp-{index}")
            age_days = PERSONAL_HISTORY_SPAN_DAYS - index * (PERSONAL_HISTORY_SPAN_DAYS // PERSONAL_HISTORY_TX_COUNT)
            timestamp = now - age_days * DAY
            value = unit * (0.3 + 0.21 * (index % 7))
            # Mostly inbound: a genuine wallet receives from many people but
            # spends rarely. Keeps its fan-out under the intermediary
            # threshold and stops the traversal from expanding through its
            # entire address book.
            if index % 7 != 0:
                txs.append(_tx(counterparty, personal, value, timestamp, f"{slug}:{personal_role}:h{index}", chain))
            else:
                txs.append(_tx(personal, counterparty, value, timestamp, f"{slug}:{personal_role}:h{index}", chain))

    vasp_hot = hot_wallet(scenario["vasp_id"], chain)
    for index in range(VASP_HISTORY_TX_COUNT):
        counterparty = synth_address(chain, f"vasp:{scenario['vasp_id']}:{chain}:cp-{index}")
        timestamp = now - (index * 6 * HOUR)
        value = unit * (1.5 + 0.4 * (index % 9))
        if index % 3 == 0:
            txs.append(_tx(vasp_hot, counterparty, value, timestamp, f"vasp:{scenario['vasp_id']}:{chain}:h{index}", chain))
        else:
            txs.append(_tx(counterparty, vasp_hot, value, timestamp, f"vasp:{scenario['vasp_id']}:{chain}:h{index}", chain))

    return txs


@lru_cache(maxsize=1)
def build_ledger() -> dict:
    """{'transactions': {chain: {address_lower: [tx]}}, 'balances': {...}}"""
    now = time.time()
    transactions: dict[str, dict[str, list[dict]]] = {}
    balances: dict[str, dict[str, float]] = {}

    for scenario in SCENARIOS:
        chain = scenario["chain"]
        chain_txs = transactions.setdefault(chain, {})
        chain_balances = balances.setdefault(chain, {})

        for tx in _scenario_transactions(scenario, now) + _background_history(scenario, now):
            for participant in (tx["from"], tx["to"]):
                chain_txs.setdefault(participant.lower(), []).append(tx)
            # Residual left behind at each hop.
            chain_balances[tx["to"].lower()] = round(
                chain_balances.get(tx["to"].lower(), 0.0) + tx["value_eth"] * 0.03, 8
            )

    for chain_txs in transactions.values():
        for address_txs in chain_txs.values():
            address_txs.sort(key=lambda t: t["timestamp"], reverse=True)

    return {"transactions": transactions, "balances": balances}


def transactions_for(address: str, chain: str) -> list[dict]:
    if not address:
        return []
    ledger = build_ledger()
    return list(ledger["transactions"].get(chain, {}).get(address.lower(), []))


def balance_for(address: str, chain: str) -> float:
    if not address:
        return 0.0
    ledger = build_ledger()
    return ledger["balances"].get(chain, {}).get(address.lower(), 0.0)
