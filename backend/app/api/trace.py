import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.core.blockchain_client import ETHERSCAN_API_KEY, BlockchainClientError
from app.core.graph_builder import trace_wallet_async
from app.db import save_case
from app.models.case import TraceRequest, TraceResult

router = APIRouter()


@router.post("/trace", response_model=TraceResult)
async def create_trace(request: TraceRequest) -> TraceResult:
    if not request.wallet_address.startswith("0x") or len(request.wallet_address) != 42:
        raise HTTPException(status_code=400, detail="wallet_address must be a valid 0x-prefixed Ethereum address")

    if not ETHERSCAN_API_KEY:
        raise HTTPException(
            status_code=502,
            detail="ETHERSCAN_API_KEY is not set. Copy .env.example to .env and add your key.",
        )

    network = "sepolia" if request.chain in ("ethereum", "sepolia") else request.chain

    try:
        graph = await trace_wallet_async(
            wallet_address=request.wallet_address,
            network=network,
            max_hops=request.max_hops,
            max_branches_per_hop=request.max_branches_per_hop,
            direction=request.direction,
        )
    except BlockchainClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


    case_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    save_case(
        case_id=case_id,
        wallet_address=request.wallet_address,
        chain=request.chain,
        max_hops=request.max_hops,
        created_at=created_at,
        nodes=graph.nodes,
        edges=graph.edges,
        flagged_exchange=graph.flagged_exchange,
        summary=graph.summary,
    )

    return TraceResult(
        case_id=case_id,
        wallet_address=request.wallet_address,
        chain=request.chain,
        max_hops=request.max_hops,
        created_at=created_at,
        nodes=graph.nodes,
        edges=graph.edges,
        flagged_exchange=graph.flagged_exchange,
        summary=graph.summary,
    )
