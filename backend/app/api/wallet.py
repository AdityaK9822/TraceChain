from fastapi import APIRouter, HTTPException
from typing import Any

from app.core.blockchain_client import get_balance, get_transactions, BlockchainClientError

router = APIRouter()


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

