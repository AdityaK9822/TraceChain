"""Matches a wallet address against known VASP hot wallets.

Backed by data/vasps.py. A match here means the address IS an exchange's hot
wallet - the end of the traceable trail. It does NOT mean the address is the
fraudster's deposit address; that is a separate, more useful inference made in
core/attribution.py from the sweep *into* one of these wallets.
"""

from typing import Optional, TypedDict

from app.data.vasps import match_hot_wallet


class ExchangeMatch(TypedDict):
    address: str
    label: str
    network: str
    chain: str
    vasp_id: str


def match(address: str, network: Optional[str] = None) -> Optional[ExchangeMatch]:
    """Return the hot-wallet record if `address` is a known VASP hot wallet."""
    if not address or not network:
        return None
    vasp = match_hot_wallet(address, network)
    if vasp is None:
        return None
    return {
        "address": vasp["hot_wallet"],
        "label": f"{vasp['name']} Hot Wallet",
        "network": network,
        "chain": network,
        "vasp_id": vasp["vasp_id"],
    }
