from fastapi import APIRouter, HTTPException

from app.db import get_case, list_cases
from app.models.case import CaseListItem, TraceResult

router = APIRouter()


@router.get("/cases", response_model=list[CaseListItem])
def get_all_cases() -> list[CaseListItem]:
    cases = list_cases()
    return [
        CaseListItem(
            case_id=c["case_id"],
            wallet_address=c["wallet_address"],
            chain=c["chain"],
            created_at=c["created_at"],
            flagged_exchange_label=(c["flagged_exchange"] or {}).get("label")
            if c["flagged_exchange"]
            else None,
            status=c["status"],
        )
        for c in cases
    ]


@router.get("/case/{case_id}", response_model=TraceResult)
def get_case_detail(case_id: str) -> TraceResult:
    case = get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return TraceResult(**case)
