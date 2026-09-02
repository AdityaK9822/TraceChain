from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.wallet import WalletEdge, WalletNode


class TraceRequest(BaseModel):
    wallet_address: str
    chain: str = "ethereum"
    max_hops: int = Field(default=3, ge=1, le=4)
    max_branches_per_hop: int = Field(default=5, ge=1, le=15)


class TraceResult(BaseModel):
    case_id: str
    wallet_address: str
    chain: str
    max_hops: int
    created_at: str
    nodes: List[WalletNode]
    edges: List[WalletEdge]
    flagged_exchange: Optional[WalletNode] = None
    summary: str


class CaseListItem(BaseModel):
    case_id: str
    wallet_address: str
    chain: str
    created_at: str
    flagged_exchange_label: Optional[str] = None
    status: str
