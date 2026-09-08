from fastapi import APIRouter, HTTPException
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

from app.core import exchange_matcher
from app.core.blockchain_client import (
    get_balance,
    get_transactions,
    get_transactions_async,
    BlockchainClientError,
)
from app.core.risk_engine import classify_node

router = APIRouter()


class ExpandNodeRequest(BaseModel):
    wallet_address: str
    hop: int = 0
    network: str = "sepolia"
    max_branches: int = Field(default=5, ge=1, le=15)
    direction: Literal["outgoing", "incoming"] = "outgoing"


@router.get("/wallet/{address}")
def get_wallet_overview(address: str, network: str = "sepolia") -> dict[str, Any]:
    if not address.startswith("0x") or len(address) != 42:
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    try:
        balance = get_balance(address, network)
    except BlockchainClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        transactions = get_transactions(address, network)
    except BlockchainClientError:
        transactions = []

    return {
        "address": address,
        "balance": balance,
        "transactions": transactions[:10], # Return top 10 recent transactions
    }


@router.get("/wallet/{address}/balance")
def get_wallet_balance(address: str, network: str = "sepolia") -> dict[str, Any]:
    if not address.startswith("0x") or len(address) != 42:
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    try:
        balance = get_balance(address, network)
    except BlockchainClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "address": address,
        "balance": balance,
        "network": network,
    }


@router.post("/wallet/expand")
async def expand_node(request: ExpandNodeRequest) -> dict[str, Any]:
    if not request.wallet_address.startswith("0x") or len(request.wallet_address) != 42:
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    source_key = request.wallet_address.lower()
    next_hop = request.hop + 1
    is_incoming = request.direction == "incoming"

    try:
        txs = await get_transactions_async(request.wallet_address, network=request.network)
    except BlockchainClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if is_incoming:
        relevant_txs = [tx for tx in txs if tx.get("to") and tx["to"].lower() == source_key]
    else:
        relevant_txs = [tx for tx in txs if tx.get("from") and tx["from"].lower() == source_key]

    relevant_txs.sort(key=lambda tx: tx["value_eth"], reverse=True)
    top_txs = relevant_txs[:request.max_branches]

    discovered_nodes: list[dict[str, Any]] = []
    discovered_edges: list[dict[str, Any]] = []
    seen_targets: set[str] = set()
    flagged_exchange: Optional[dict[str, Any]] = None

    for tx in top_txs:
        target = tx["from"] if is_incoming else tx["to"]
        if not target:
            continue
        target_key = target.lower()

        edge_src = tx["from"]
        edge_tgt = tx["to"]

        discovered_edges.append(
            {
                "source": edge_src,
                "target": edge_tgt,
                "tx_hash": tx["hash"],
                "value_eth": tx["value_eth"],
                "timestamp": tx["timestamp"],
                "hop": next_hop,
            }
        )

        if target_key not in seen_targets and target_key != source_key:
            seen_targets.add(target_key)
            exchange = exchange_matcher.match(target, network=request.network)
            node_data = {
                "id": target,
                "hop": next_hop,
                "risk_tag": "unknown",
                "risk_score": 50,
                "label": exchange["label"] if exchange else None,
                "exchange_network": exchange["network"] if exchange else None,
                "tx_count": 1,
                "total_value_eth": tx["value_eth"],
            }
            node_data["risk_tag"] = classify_node(node_data, exchange_match=exchange)
            discovered_nodes.append(node_data)

            if node_data["risk_tag"] == "exchange" and flagged_exchange is None:
                flagged_exchange = node_data

    return {
        "source_wallet": request.wallet_address,
        "hop": request.hop,
        "nodes": discovered_nodes,
        "edges": discovered_edges,
        "flagged_exchange": flagged_exchange,
    }


