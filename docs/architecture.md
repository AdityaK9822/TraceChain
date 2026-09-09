# Architecture

``` 
┌─────────────────┐        POST /api/trace          ┌───────────────────┐        GET account/txlist       ┌───────────────┐
│  Next.js        | ──────────────────────────────▶ │  FastAPI backend  │ ──────────────────────────────▶ │ Etherscan API │
│  (Investigator  │ ◀────────────────────────────── │                   │ ◀────────────────────────────── │ (Sepolia /    │
│   dashboard)    │   nodes / edges / risk tags     │                   │        transaction list         │  mainnet)     │
└─────────────────┘                                 └───────────────────┘                                 └───────────────┘
                                                                │
                                                                ▼
                                                        ┌───────────────┐
                                                        │  SQLite       │
                                                        │ (cases, saved │
                                                        │   graphs)     │
                                                        └───────────────┘
```

## Request flow (`POST /api/trace`)

1. **`api/trace.py`** validates the address and that `ETHERSCAN_API_KEY` is configured.
2. **`core/graph_builder.py`** runs a breadth-first trace:
   - starts at the reported wallet (hop 0)
   - at each hop, calls **`core/blockchain_client.py`** to fetch the wallet's
     transactions from Etherscan, takes the top N outgoing transfers by value
     (`max_branches_per_hop`, default 5) to keep the graph readable, and queues
     the recipient wallets for the next hop
   - each newly discovered wallet is checked against
     **`core/exchange_matcher.py`** (the curated known-exchange-wallet list).
     A match is tagged `exchange` and is **not** expanded further - the funds
     have left the traceable on-chain path.
   - after the BFS completes, **`core/risk_engine.py`** does a second pass to
     promote high-fan-out passthrough wallets to `intermediary`
3. The resulting graph (nodes + edges) and a plain-language summary are saved
   to SQLite via **`db.py`** and returned to the frontend.
4. The frontend (**`FundFlowGraph.jsx`**) renders the graph with
   `react-force-graph-2d`, revealing nodes hop-by-hop for the live "building"
   effect, and highlights the flagged exchange node.
5. **`GET /api/report/{case_id}`** renders the saved case through a Jinja2
   HTML template (**`templates/report.html`**), with an optional PDF export
   via `weasyprint` if installed.

## Why BFS with capped branching

A wallet used to launder funds can fan out into dozens of small transfers per
hop. Tracing all of them both blows up the Etherscan request budget and turns
the graph into an unreadable hairball on stage. Capping branches to the
highest-value transfers per hop keeps the trace on the path that actually
matters (where the bulk of the money went) and keeps the demo graph legible.

## Data model (SQLite)

A single `cases` table stores each trace: the reported address, chain,
hop depth, the full node/edge graph as JSON, the flagged exchange (if any),
and a human-readable summary. This is intentionally denormalized - simple to
query, simple to serve back as a whole "case" object, and fast enough for
hackathon-scale data volumes.
