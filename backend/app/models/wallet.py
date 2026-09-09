from typing import List, Literal, Optional

from pydantic import BaseModel

RiskTag = Literal[
    "reported",
    "exchange",          # a VASP hot wallet - end of the traceable trail
    "deposit_address",   # the fraudster's KYC'd deposit address at a VASP
    "mule",              # behaves as laundering infrastructure (see behavior)
    "intermediary",
    "unknown",
]

# How the wallet behaves, judged from its own history - see
# core/wallet_profile.py. Orthogonal to risk_tag.
Behavior = Literal["mule", "personal", "service", "vasp", "deposit", "unclear"]


class WalletNode(BaseModel):
    id: str  # wallet address
    hop: int
    risk_tag: RiskTag
    label: Optional[str] = None  # e.g. "Binance Hot Wallet"
    exchange_network: Optional[str] = None  # "mainnet" | "sepolia"
    tx_count: int = 0
    total_value_eth: float = 0.0
    # 0-100, higher = less suspicious behaviour. Independent of risk_tag -
    # see core/trust_score.py. Defaults to neutral for nodes scored before
    # trust scoring shipped, and for single-hop expand results.
    trust_score: int = 50
    hops_to_nearest_exchange: Optional[int] = None
    behavior: Behavior = "unclear"
    behavior_label: Optional[str] = None
    behavior_reasons: List[str] = []


class WalletEdge(BaseModel):
    source: str
    target: str
    tx_hash: str
    value_eth: float
    timestamp: int
    hop: int
