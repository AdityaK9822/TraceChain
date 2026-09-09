import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.core.blockchain_client import BlockchainClientError
from app.core.chains import UnknownChainError, chain_symbol, validate_address
from app.core.graph_builder import trace_wallet_async
from app.db import save_case
from app.models.case import TraceRequest, TraceResult

router = APIRouter()


@router.post("/trace", response_model=TraceResult)
async def create_trace(request: TraceRequest) -> TraceResult:
    try:
        symbol = chain_symbol(request.chain)
    except UnknownChainError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not validate_address(request.wallet_address, request.chain):
        raise HTTPException(
            status_code=400,
            detail=f"'{request.wallet_address}' is not a valid {request.chain} address.",
        )

    try:
        graph = await trace_wallet_async(
            wallet_address=request.wallet_address,
            network=request.chain,
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
        pattern_findings=graph.pattern_findings,
        asset_symbol=symbol,
        deposit_address=graph.deposit_address,
        vasp=graph.vasp,
        historical=graph.historical,
        correlation=graph.correlation,
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
        pattern_findings=graph.pattern_findings,
        asset_symbol=symbol,
        deposit_address=graph.deposit_address,
        vasp=graph.vasp,
        historical=graph.historical,
        correlation=graph.correlation,
    )
