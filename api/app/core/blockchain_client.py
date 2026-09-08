"""Thin wrapper around the Etherscan (v2 multichain) API.

We use the "normal transactions" endpoint (account/txlist) to pull a wallet's
outgoing transaction history. No node is required - this is pure REST.

Etherscan's free tier is rate-limited (5 req/s, ~100k/day). During dev and
right before a demo, responses should be cached (see `_CACHE`) so a flaky
connection or rate limit can't sink a live trace.
"""

import os
import time
from typing import Any

import httpx

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")
ETHERSCAN_BASE_URL = "https://api.etherscan.io/v2/api"

# chain -> Etherscan v2 chainid
CHAIN_IDS = {
    "ethereum": 1,
    "ethereum-mainnet": 1,
    "sepolia": 11155111,
}

DEFAULT_NETWORK = os.getenv("ETHERSCAN_NETWORK", "sepolia")

_CACHE: dict[str, list[dict[str, Any]]] = {}
_CACHE_TTL_SECONDS = 60
_CACHE_TIMESTAMPS: dict[str, float] = {}


class BlockchainClientError(RuntimeError):
    pass


def get_transactions(address: str, network: str | None = None) -> list[dict[str, Any]]:
    """Fetch outgoing + incoming normal transactions for a wallet address.

    Returns a list of dicts with normalized fields:
        {from, to, hash, value_eth, timestamp}
    """
    network = network or DEFAULT_NETWORK
    cache_key = f"{network}:{address.lower()}"

    cached = _CACHE.get(cache_key)
    if cached is not None and (time.time() - _CACHE_TIMESTAMPS[cache_key]) < _CACHE_TTL_SECONDS:
        return cached

    if not ETHERSCAN_API_KEY:
        raise BlockchainClientError(
            "ETHERSCAN_API_KEY is not set. Copy .env.example to .env and add your key."
        )

    chain_id = CHAIN_IDS.get(network, CHAIN_IDS["sepolia"])
    params = {
        "chainid": chain_id,
        "module": "account",
        "action": "txlist",
        "address": address,
        "startblock": 0,
        "endblock": 99999999,
        "sort": "asc",
        "apikey": ETHERSCAN_API_KEY,
    }

    try:
        resp = httpx.get(ETHERSCAN_BASE_URL, params=params, timeout=10.0)
        resp.raise_for_status()
        payload = resp.json()
    except httpx.HTTPError as exc:
        raise BlockchainClientError(f"Etherscan request failed: {exc}") from exc

    # Etherscan returns status "0" both for "no transactions" and for real errors.
    if payload.get("status") == "0" and payload.get("message") != "No transactions found":
        raise BlockchainClientError(f"Etherscan error: {payload.get('result')}")

    raw_txs = payload.get("result", []) if isinstance(payload.get("result"), list) else []

    txs = [
        {
            "from": tx["from"],
            "to": tx["to"],
            "hash": tx["hash"],
            "value_eth": int(tx["value"]) / 1e18 if tx.get("value") else 0.0,
            "timestamp": int(tx["timeStamp"]),
        }
        for tx in raw_txs
        if tx.get("to")  # skip contract-creation txs with no `to`
    ]

    _CACHE[cache_key] = txs
    _CACHE_TIMESTAMPS[cache_key] = time.time()
    return txs

def get_balance(address: str, network: str | None = None) -> float:
    """Fetch the ETH balance for a wallet address."""
    network = network or DEFAULT_NETWORK
    cache_key = f"balance:{network}:{address.lower()}"

    cached = _CACHE.get(cache_key)
    if cached is not None and (time.time() - _CACHE_TIMESTAMPS[cache_key]) < _CACHE_TTL_SECONDS:
        return float(cached[0]["value"]) if cached else 0.0

    if not ETHERSCAN_API_KEY:
        raise BlockchainClientError(
            "ETHERSCAN_API_KEY is not set. Copy .env.example to .env and add your key."
        )

    chain_id = CHAIN_IDS.get(network, CHAIN_IDS["sepolia"])
    params = {
        "chainid": chain_id,
        "module": "account",
        "action": "balance",
        "address": address,
        "tag": "latest",
        "apikey": ETHERSCAN_API_KEY,
    }

    try:
        resp = httpx.get(ETHERSCAN_BASE_URL, params=params, timeout=10.0)
        resp.raise_for_status()
        payload = resp.json()
    except httpx.HTTPError as exc:
        raise BlockchainClientError(f"Etherscan request failed: {exc}") from exc

    if payload.get("status") == "0" and payload.get("message") != "OK":
        raise BlockchainClientError(f"Etherscan error: {payload.get('result')}")

    wei_balance = int(payload.get("result", 0))
    eth_balance = wei_balance / 1e18

    # Store in cache as a dummy list to reuse the _CACHE dict type
    _CACHE[cache_key] = [{"value": eth_balance}]
    _CACHE_TIMESTAMPS[cache_key] = time.time()
    
    return eth_balance
