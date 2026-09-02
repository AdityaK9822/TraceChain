import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "cryptotrace.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS cases (
    case_id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    max_hops INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    graph_json TEXT NOT NULL,
    flagged_exchange_json TEXT,
    summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'complete'
);
"""


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.execute(SCHEMA)


def save_case(
    case_id: str,
    wallet_address: str,
    chain: str,
    max_hops: int,
    created_at: str,
    nodes: list,
    edges: list,
    flagged_exchange: dict | None,
    summary: str,
) -> None:
    graph_json = json.dumps({"nodes": nodes, "edges": edges})
    flagged_json = json.dumps(flagged_exchange) if flagged_exchange else None
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO cases
                (case_id, wallet_address, chain, max_hops, created_at,
                 graph_json, flagged_exchange_json, summary, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'complete')
            """,
            (
                case_id,
                wallet_address,
                chain,
                max_hops,
                created_at,
                graph_json,
                flagged_json,
                summary,
            ),
        )


def get_case(case_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM cases WHERE case_id = ?", (case_id,)
        ).fetchone()
    if row is None:
        return None
    return _row_to_case(row)


def list_cases() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM cases ORDER BY created_at DESC"
        ).fetchall()
    return [_row_to_case(row) for row in rows]


def _row_to_case(row: sqlite3.Row) -> dict:
    graph = json.loads(row["graph_json"])
    flagged = json.loads(row["flagged_exchange_json"]) if row["flagged_exchange_json"] else None
    return {
        "case_id": row["case_id"],
        "wallet_address": row["wallet_address"],
        "chain": row["chain"],
        "max_hops": row["max_hops"],
        "created_at": row["created_at"],
        "nodes": graph["nodes"],
        "edges": graph["edges"],
        "flagged_exchange": flagged,
        "summary": row["summary"],
        "status": row["status"],
    }
