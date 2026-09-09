from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from app.models.wallet import WalletEdge, WalletNode


class TraceRequest(BaseModel):
    wallet_address: str
    chain: str = "ethereum"
    # The full laundering path runs reported -> mules -> collector -> peel ->
    # deposit address -> VASP hot wallet, so the default depth has to reach it.
    max_hops: int = Field(default=6, ge=1, le=8)
    max_branches_per_hop: int = Field(default=5, ge=1, le=15)
    direction: Literal["outgoing", "incoming"] = "outgoing"


class PatternFinding(BaseModel):
    pattern_type: Literal["sweep", "peel_chain", "structuring", "round_number"]
    severity: Literal["low", "medium", "high"]
    description: str
    node_ids: List[str] = []
    edge_tx_hashes: List[str] = []


class VaspInfo(BaseModel):
    """The exchange behind a deposit address - who to serve for KYC."""

    vasp_id: str
    name: str
    jurisdiction: str
    kyc_contact: str
    response_sla_days: int
    hot_wallet: str


class DepositAddress(BaseModel):
    """The fraudster's cash-out address at a VASP."""

    address: str
    hop: Optional[int] = None
    vasp: VaspInfo
    evidence_tx_hash: Optional[str] = None
    swept_value: float = 0.0
    confidence: float = 0.0


class SharedWallet(BaseModel):
    address: str
    live_hop: Optional[int] = None
    historical_hop: Optional[int] = None
    behavior: Optional[str] = None


class CorrelationResult(BaseModel):
    """Overlap between this trace and the same actor's earlier one."""

    prior_case_label: Optional[str] = None
    shared_wallets: List[SharedWallet] = []
    shared_count: int = 0
    deposit_address_reused: bool = False
    predicted_deposit_address: Optional[str] = None
    predicted_vasp: Optional[VaspInfo] = None
    confidence: float = 0.0
    # Hop at which the reuse first becomes visible - the point the prediction
    # genuinely becomes available, ahead of the funds arriving.
    available_at_hop: Optional[int] = None
    rationale: str = ""


class HistoricalTrace(BaseModel):
    """The actor's previous laundering path, traced by the same engine."""

    case_label: Optional[str] = None
    actor_id: Optional[str] = None
    wallet_address: str
    chain: str
    nodes: List[WalletNode] = []
    edges: List[WalletEdge] = []
    deposit_address: Optional[str] = None
    occurred_days_ago: Optional[int] = None


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
    pattern_findings: List[PatternFinding] = []
    asset_symbol: str = "ETH"
    deposit_address: Optional[DepositAddress] = None
    vasp: Optional[VaspInfo] = None
    historical: Optional[HistoricalTrace] = None
    correlation: Optional[CorrelationResult] = None


class ComplaintReport(BaseModel):
    """One incoming fraud report in the complaint feed."""

    report_id: str
    chain: str
    chain_label: str
    asset_symbol: str
    address: str
    fraud_type: str
    amount_inr: int
    state: str
    hours_ago: int
    # True when this actor's wallets have been traced before, so a deposit
    # address can potentially be predicted.
    repeat_offender: bool = False


class CaseListItem(BaseModel):
    case_id: str
    wallet_address: str
    chain: str
    created_at: str
    flagged_exchange_label: Optional[str] = None
    status: str
