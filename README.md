# CryptoTrace LEA

Given a victim-reported crypto wallet address, automatically trace its
transactions hop-by-hop and identify the exchange (VASP) wallet where the
funds ended up - visualized as a live fund-flow graph, for law enforcement
investigators.

Built for **SIH PS 26183**. See [docs/problem-statement.md](docs/problem-statement.md)
for the full context and [docs/roadmap.md](docs/roadmap.md) for what's
intentionally out of scope for v1.

## Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Graph visualization | `react-force-graph-2d` |
| Backend | Python + FastAPI |
| Blockchain data | Etherscan API (Sepolia testnet for demo, mainnet supported) |
| Database | SQLite |
| Reports | Jinja2 → HTML, optional PDF via `weasyprint` |

## Repo layout

```
frontend/     Next.js dashboard (wallet input, fund-flow graph, reports)
backend/      FastAPI service (tracing, risk tagging, report generation)
sample-data/  Demo wallet chain + mock complaint feed
docs/         Problem statement, architecture, API spec, data sources, roadmap
```

## Quickstart

### 1. Configure environment

```bash
cp .env.example .env
# Add your ETHERSCAN_API_KEY (free at https://etherscan.io/apis)
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # or symlink - backend reads its own .env
uvicorn app.main:app --reload --port 8000
```

Runs at `http://localhost:8000`. Interactive API docs at `/docs`.

Run tests: `pytest`

### 3. Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local
npm run dev
```

Runs at `http://localhost:3000`.

### 4. Try it

Paste any Ethereum wallet address into the dashboard, or click "Investigate"
on one of the mock complaints. **For a guaranteed live demo**, follow
[docs/data-sources.md](docs/data-sources.md) to set up a pre-tested Sepolia
wallet chain that reliably resolves to a flagged exchange deposit - tracing
an arbitrary live address is not reliable for stage demos.

## Demo narrative

1. Mock complaint comes in with a reported wallet address.
2. Investigator pastes it into the dashboard, sets trace depth, hits "Trace wallet".
3. Fund-flow graph builds live, hop by hop.
4. The exchange deposit node lights up: 🚨 **Exchange Deposit Detected**.
5. Investigator clicks "Generate Report" → clean investigation summary (HTML/PDF).

Full demo script: [docs/roadmap.md](docs/roadmap.md) has the "what's next"
close; API details for a backend teammate: [docs/api-spec.md](docs/api-spec.md).
