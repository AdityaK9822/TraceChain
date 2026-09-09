"""Chain data access - reads the synthetic ledger, not a live network.

This module used to call the Etherscan API. For the prototype it serves the
same normalized transaction shape out of data/dummy_ledger.py instead, so the
whole backend runs offline with no API key and no rate limits, while every
engine above it (BFS traversal, pattern detection, trust scoring,
attribution) keeps operating on real data structures rather than canned
screenshots.

The three public functions keep their original signatures so nothing
upstream had to change. The `network` argument is now a chain key from
core/chains.py ("ethereum", "bitcoin", "tron", ...).

Transactions are returned newest-first as:
    {"from", "to", "hash", "value_eth", "timestamp"}
`value_eth` is in the chain's native units despite the legacy name.
"""

from typing import Any

from app.core.chains import DEFAULT_CHAIN, UnknownChainError, get_chain
from app.data import dummy_ledger


class BlockchainClientError(RuntimeError):
    """Raised when chain data cannot be served for a request."""


def _resolve_chain(network: str | None) -> str:
    try:
        get_chain(network)
    except UnknownChainError as exc:
        raise BlockchainClientError(str(exc)) from exc
    return (network or DEFAULT_CHAIN).lower()


def get_transactions(address: str, network: str | None = None) -> list[dict[str, Any]]:
    """Transactions involving `address`, newest first.

    An address with no ledger entry returns [] rather than raising - the
    traversal fetches every discovered node, including terminal ones we have
    no history for.
    """
    chain = _resolve_chain(network)
    return dummy_ledger.transactions_for(address, chain)


async def get_transactions_async(address: str, network: str | None = None) -> list[dict[str, Any]]:
    """Async twin of `get_transactions` (the ledger lookup is in-memory)."""
    return get_transactions(address, network)


def get_balance(address: str, network: str | None = None) -> float:
    """Current native-unit balance for `address`."""
    chain = _resolve_chain(network)
    return dummy_ledger.balance_for(address, chain)
