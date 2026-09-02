from typing import Literal, Optional

from pydantic import BaseModel

RiskTag = Literal["reported", "exchange", "intermediary", "unknown"]


class WalletNode(BaseModel):
    id: str  # wallet address
    hop: int
    risk_tag: RiskTag
    label: Optional[str] = None  # e.g. "Binance Hot Wallet"
    exchange_network: Optional[str] = None  # "mainnet" | "sepolia"
    tx_count: int = 0
    total_value_eth: float = 0.0


class WalletEdge(BaseModel):
    source: str
    target: str
    tx_hash: str
    value_eth: float
    timestamp: int
    hop: int
