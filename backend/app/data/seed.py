"""Seeds a couple of completed cases so a fresh clone isn't an empty console.

Runs at startup only when the cases table is empty. The seeded cases are
produced by the real trace pipeline rather than hand-written rows, so they
carry the same analysis payload as anything traced live during a demo.
"""

import uuid
from datetime import datetime, timedelta, timezone

from app.core.chains import chain_symbol
from app.core.graph_builder import trace_wallet_async
from app.data import scenarios
from app.db import list_cases, save_case

# Seeded so the console has history without giving away the two scenarios
# most likely to be demoed live.
SEED_SLUGS = ["polygon-job-current", "sol-phish-current"]


async def seed_demo_cases() -> int:
    """Insert demo cases if none exist. Returns how many were created."""
    if list_cases():
        return 0

    created = 0
    for index, slug in enumerate(SEED_SLUGS):
        scenario = scenarios.get_scenario(slug)
        if not scenario:
            continue

        address = scenarios.reported_address(scenario)
        graph = await trace_wallet_async(
            wallet_address=address, network=scenario["chain"], max_hops=6
        )
        created_at = (
            datetime.now(timezone.utc) - timedelta(hours=scenario.get("hours_ago", 24) + index)
        ).isoformat()

        save_case(
            case_id=str(uuid.uuid4()),
            wallet_address=address,
            chain=scenario["chain"],
            max_hops=6,
            created_at=created_at,
            nodes=graph.nodes,
            edges=graph.edges,
            flagged_exchange=graph.flagged_exchange,
            summary=graph.summary,
            pattern_findings=graph.pattern_findings,
            asset_symbol=chain_symbol(scenario["chain"]),
            deposit_address=graph.deposit_address,
            vasp=graph.vasp,
            historical=graph.historical,
            correlation=graph.correlation,
        )
        created += 1

    return created
