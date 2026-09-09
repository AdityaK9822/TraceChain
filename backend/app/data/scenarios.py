"""Demo scenario specs - the narratives the dummy ledger is generated from.

Each scenario is one fraud complaint: a reported wallet, the mules the money
is split across, the collector that sweeps it back together, the peel chain
that layers it, and the deposit address it finally lands on before being
swept into a VASP hot wallet.

Roles are names, not addresses. A role beginning with "@" is **global** -
the same address is shared by every scenario that references it. That is how
we model a fraudster reusing infrastructure: when a current case and that
actor's prior case share a mule (and a deposit address), the correlation
engine can predict where this batch of money is heading before it arrives.

Addresses are synthesised deterministically from these role names, so nothing
here needs hand-maintained address literals.
"""

from app.data.addresses import synth_address

# Roles marked global are shared across scenarios (reused fraud infrastructure).
GLOBAL_PREFIX = "@"


def resolve_role(chain: str, slug: str, role: str) -> str:
    """Role name -> synthetic address (global roles are scenario-independent)."""
    if role.startswith(GLOBAL_PREFIX):
        return synth_address(chain, f"global:{role[1:]}")
    return synth_address(chain, f"{slug}:{role}")


# `hours_ago` anchors each scenario relative to ledger build time, so the
# demo feed always reads as "just came in" and mule wallets always look fresh.
SCENARIOS = [
    # --- Ethereum: investment scam, reuses infrastructure from a prior case ---
    {
        "slug": "eth-invest-prior",
        "chain": "ethereum",
        "actor_id": "ACT-INV-001",
        "prior_slug": None,
        "in_feed": False,
        "amount": 8.6,
        "hours_ago": 5900,  # ~8 months earlier
        "mules": ["mule-a", "@eth-mule-shared-01", "mule-c"],
        "peel": ["peel-1", "peel-2"],
        "deposit": "@eth-deposit-binance-01",
        "vasp_id": "binance",
        "personal": [],
        "fraud_type": "Investment/Trading Scam",
        "amount_inr": 2_140_000,
        "state": "Maharashtra",
    },
    {
        "slug": "eth-invest-current",
        "chain": "ethereum",
        "actor_id": "ACT-INV-001",
        "prior_slug": "eth-invest-prior",
        "in_feed": True,
        "amount": 12.4,
        "hours_ago": 6,
        "mules": ["mule-a", "@eth-mule-shared-01", "mule-c"],
        "peel": ["peel-1", "peel-2"],
        "deposit": "@eth-deposit-binance-01",
        "vasp_id": "binance",
        "personal": ["@eth-personal-merchant-01"],
        "fraud_type": "Investment/Trading Scam",
        "amount_inr": 3_180_000,
        "state": "Maharashtra",
    },
    # --- Tron USDT: sextortion ring, also a repeat offender ---
    {
        "slug": "tron-sextortion-prior",
        "chain": "tron",
        "actor_id": "ACT-SEX-004",
        "prior_slug": None,
        "in_feed": False,
        "amount": 41_000.0,
        "hours_ago": 3100,
        "mules": ["mule-a", "@tron-mule-shared-01", "mule-c"],
        "peel": ["peel-1", "peel-2"],
        "deposit": "@tron-deposit-bybit-01",
        "vasp_id": "bybit",
        "personal": [],
        "fraud_type": "Sextortion / Blackmail",
        "amount_inr": 3_500_000,
        "state": "Karnataka",
    },
    {
        "slug": "tron-sextortion-current",
        "chain": "tron",
        "actor_id": "ACT-SEX-004",
        "prior_slug": "tron-sextortion-prior",
        "in_feed": True,
        "amount": 26_500.0,
        "hours_ago": 3,
        "mules": ["mule-a", "@tron-mule-shared-01", "mule-c"],
        "peel": ["peel-1", "peel-2"],
        "deposit": "@tron-deposit-bybit-01",
        "vasp_id": "bybit",
        "personal": ["@tron-personal-shop-01"],
        "fraud_type": "Sextortion / Blackmail",
        "amount_inr": 2_260_000,
        "state": "Karnataka",
    },
    # --- BSC: rug pull, repeat offender ---
    {
        "slug": "bsc-rug-prior",
        "chain": "bsc",
        "actor_id": "ACT-RUG-009",
        "prior_slug": None,
        "in_feed": False,
        "amount": 190.0,
        "hours_ago": 4200,
        "mules": ["mule-a", "@bsc-mule-shared-01", "mule-c"],
        "peel": ["peel-1", "peel-2"],
        "deposit": "@bsc-deposit-binance-01",
        "vasp_id": "binance",
        "personal": [],
        "fraud_type": "Fake Token / Rug Pull",
        "amount_inr": 9_700_000,
        "state": "Telangana",
    },
    {
        "slug": "bsc-rug-current",
        "chain": "bsc",
        "actor_id": "ACT-RUG-009",
        "prior_slug": "bsc-rug-prior",
        "in_feed": True,
        "amount": 240.0,
        "hours_ago": 11,
        "mules": ["mule-a", "@bsc-mule-shared-01", "mule-c"],
        "peel": ["peel-1", "peel-2"],
        "deposit": "@bsc-deposit-binance-01",
        "vasp_id": "binance",
        "personal": ["@bsc-personal-trader-01"],
        "fraud_type": "Fake Token / Rug Pull",
        "amount_inr": 12_300_000,
        "state": "Telangana",
    },
    # --- First-time offenders: no prior case, so no prediction is possible ---
    {
        "slug": "btc-ransom-current",
        "chain": "bitcoin",
        "actor_id": "ACT-RAN-021",
        "prior_slug": None,
        "in_feed": True,
        "amount": 0.86,
        "hours_ago": 19,
        "mules": ["mule-a", "mule-b", "mule-c"],
        "peel": ["peel-1", "peel-2"],
        "deposit": "btc-deposit-coindcx-01",
        "vasp_id": "coindcx",
        "personal": ["@btc-personal-01"],
        "fraud_type": "Ransomware Payout",
        "amount_inr": 7_400_000,
        "state": "Delhi",
    },
    {
        "slug": "polygon-job-current",
        "chain": "polygon",
        "actor_id": "ACT-JOB-033",
        "prior_slug": None,
        "in_feed": True,
        "amount": 74_000.0,
        "hours_ago": 27,
        "mules": ["mule-a", "mule-b", "mule-c"],
        "peel": ["peel-1", "peel-2"],
        "deposit": "poly-deposit-wazirx-01",
        "vasp_id": "wazirx",
        "personal": ["@poly-personal-01"],
        "fraud_type": "Fake Job / Task Scam",
        "amount_inr": 4_100_000,
        "state": "Tamil Nadu",
    },
    {
        "slug": "sol-phish-current",
        "chain": "solana",
        "actor_id": "ACT-PHI-047",
        "prior_slug": None,
        "in_feed": True,
        "amount": 610.0,
        "hours_ago": 33,
        "mules": ["mule-a", "mule-b", "mule-c"],
        "peel": ["peel-1", "peel-2"],
        "deposit": "sol-deposit-coinbase-01",
        "vasp_id": "coinbase",
        "personal": ["@sol-personal-01"],
        "fraud_type": "Wallet-Drainer Phishing",
        "amount_inr": 1_950_000,
        "state": "Gujarat",
    },
]


def get_scenario(slug: str) -> dict | None:
    for scenario in SCENARIOS:
        if scenario["slug"] == slug:
            return scenario
    return None


def reported_address(scenario: dict) -> str:
    return resolve_role(scenario["chain"], scenario["slug"], "reported")


def find_scenario_by_reported_address(address: str) -> dict | None:
    """Which scenario does this reported wallet belong to?"""
    if not address:
        return None
    key = address.lower()
    for scenario in SCENARIOS:
        if reported_address(scenario).lower() == key:
            return scenario
    return None


def feed_scenarios() -> list[dict]:
    return [s for s in SCENARIOS if s.get("in_feed")]
