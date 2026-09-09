"""Chain registry - the single source of truth for per-chain behaviour.

Everything that varies between blockchains lives here: the native asset the
UI should display, how an address is shaped, which block explorer to link to,
and the value magnitudes the pattern detectors should treat as
"suspiciously round" (0.5 ETH and 500 USDT are both round numbers; sharing
one threshold across chains would misfire badly).

Addresses are compared case-insensitively across the codebase (`.lower()` is
used as the canonical key). That is correct for hex EVM addresses but not for
Base58/Bech32 chains, where case is significant. Since every address in this
prototype comes from our own fixtures we simply never author two that differ
only by case - see data/scenarios.py.
"""

import re
from typing import Any

_EVM_PATTERN = r"^0x[a-fA-F0-9]{40}$"

CHAINS: dict[str, dict[str, Any]] = {
    "ethereum": {
        "label": "Ethereum",
        "symbol": "ETH",
        "color": "#627EEA",
        "address_pattern": _EVM_PATTERN,
        "explorer": "https://etherscan.io",
        "round_step": 0.5,
        "min_round_value": 0.1,
        "value_decimals": 4,
    },
    "bitcoin": {
        "label": "Bitcoin",
        "symbol": "BTC",
        "color": "#F7931A",
        # bech32 (bc1...) or legacy/P2SH base58 (1... / 3...)
        "address_pattern": r"^(bc1[02-9ac-hj-np-z]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$",
        "explorer": "https://mempool.space",
        "round_step": 0.01,
        "min_round_value": 0.005,
        "value_decimals": 6,
    },
    "tron": {
        "label": "Tron",
        # Tron fraud flows are overwhelmingly USDT-TRC20, not native TRX.
        "symbol": "USDT",
        "color": "#EF0027",
        "address_pattern": r"^T[1-9A-HJ-NP-Za-km-z]{33}$",
        "explorer": "https://tronscan.org/#",
        "round_step": 500.0,
        "min_round_value": 100.0,
        "value_decimals": 2,
    },
    "bsc": {
        "label": "BNB Chain",
        "symbol": "BNB",
        "color": "#F3BA2F",
        "address_pattern": _EVM_PATTERN,
        "explorer": "https://bscscan.com",
        "round_step": 0.5,
        "min_round_value": 0.1,
        "value_decimals": 4,
    },
    "polygon": {
        "label": "Polygon",
        "symbol": "POL",
        "color": "#8247E5",
        "address_pattern": _EVM_PATTERN,
        "explorer": "https://polygonscan.com",
        "round_step": 50.0,
        "min_round_value": 10.0,
        "value_decimals": 2,
    },
    "solana": {
        "label": "Solana",
        "symbol": "SOL",
        "color": "#14F195",
        "address_pattern": r"^[1-9A-HJ-NP-Za-km-z]{32,44}$",
        "explorer": "https://solscan.io",
        "round_step": 5.0,
        "min_round_value": 1.0,
        "value_decimals": 3,
    },
}

DEFAULT_CHAIN = "ethereum"


class UnknownChainError(ValueError):
    pass


def get_chain(chain: str | None) -> dict[str, Any]:
    """Look up a chain's config. Falls back to the default for None/empty."""
    key = (chain or DEFAULT_CHAIN).lower()
    if key not in CHAINS:
        raise UnknownChainError(
            f"Unknown chain '{chain}'. Supported: {', '.join(sorted(CHAINS))}."
        )
    return CHAINS[key]


def chain_symbol(chain: str | None) -> str:
    return get_chain(chain)["symbol"]


def validate_address(address: str, chain: str | None = None) -> bool:
    """True if `address` is well-formed for `chain`."""
    if not address:
        return False
    try:
        config = get_chain(chain)
    except UnknownChainError:
        return False
    return re.match(config["address_pattern"], address) is not None


def detect_chain(address: str) -> str | None:
    """Best-effort chain inference from an address's shape.

    EVM chains are indistinguishable by format, so a 0x address always
    resolves to ethereum - the caller should pass an explicit chain when it
    knows better.
    """
    if not address:
        return None
    if re.match(_EVM_PATTERN, address):
        return "ethereum"
    for name in ("bitcoin", "tron", "solana"):
        if re.match(CHAINS[name]["address_pattern"], address):
            return name
    return None


def explorer_address_url(address: str, chain: str | None = None) -> str:
    return f"{get_chain(chain)['explorer']}/address/{address}"


def explorer_tx_url(tx_hash: str, chain: str | None = None) -> str:
    return f"{get_chain(chain)['explorer']}/tx/{tx_hash}"
