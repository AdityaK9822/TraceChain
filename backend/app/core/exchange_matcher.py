"""Matches a wallet address against the curated known-exchange-wallet list."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Optional, TypedDict

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "known_exchange_wallets.json"


class ExchangeMatch(TypedDict):
    address: str
    label: str
    network: str
    chain: str


@lru_cache(maxsize=1)
def _load_exchange_wallets() -> dict[str, ExchangeMatch]:
    with open(DATA_PATH) as f:
        entries = json.load(f)
    return {entry["address"].lower(): entry for entry in entries}


def match(address: str, network: Optional[str] = None) -> Optional[ExchangeMatch]:
    """Return the exchange wallet record if `address` is a known exchange wallet.

    If `network` is given, only matches within that network (mainnet/sepolia);
    otherwise matches across all known networks.
    """
    entry = _load_exchange_wallets().get(address.lower())
    if entry is None:
        return None
    if network and entry.get("network") != network:
        return None
    return entry
