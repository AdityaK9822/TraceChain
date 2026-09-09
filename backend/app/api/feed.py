"""The incoming complaint feed.

Stands in for a live NCRP/SAHYOG ingest. Serving it from the backend rather
than hardcoding addresses in the frontend keeps one source of truth: the
addresses here are the same synthetic addresses the tracing engine knows
about, so every entry in the feed is actually traceable.
"""

from fastapi import APIRouter

from app.core.chains import get_chain
from app.data import scenarios
from app.models.case import ComplaintReport

router = APIRouter()


@router.get("/feed", response_model=list[ComplaintReport])
def get_complaint_feed() -> list[ComplaintReport]:
    reports: list[ComplaintReport] = []

    for index, scenario in enumerate(scenarios.feed_scenarios()):
        chain = get_chain(scenario["chain"])
        reports.append(
            ComplaintReport(
                report_id=f"NCRP-2026-{4170000 + index * 1337}",
                chain=scenario["chain"],
                chain_label=chain["label"],
                asset_symbol=chain["symbol"],
                address=scenarios.reported_address(scenario),
                fraud_type=scenario["fraud_type"],
                amount_inr=scenario["amount_inr"],
                state=scenario["state"],
                hours_ago=scenario["hours_ago"],
                repeat_offender=bool(scenario.get("prior_slug")),
            )
        )

    reports.sort(key=lambda r: r.hours_ago)
    return reports
