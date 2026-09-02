# API Spec

Base URL: `http://localhost:8000/api`

## `POST /trace`

Trace a wallet's fund flow and create a case.

**Request body**
```json
{
  "wallet_address": "0x28C6c06298d514Db089934071355E5743bf21d60",
  "chain": "ethereum",
  "max_hops": 3,
  "max_branches_per_hop": 5
}
```

- `chain` - currently only `"ethereum"` is supported. Internally resolves to
  the network set in `ETHERSCAN_NETWORK` (`sepolia` for demo, `ethereum` for
  real mainnet tracing).
- `max_hops` - 1 to 4, default 3.
- `max_branches_per_hop` - 1 to 15, default 5. Caps fan-out per hop so the
  graph stays readable.

**Response `200`**
```json
{
  "case_id": "uuid",
  "wallet_address": "0x...",
  "chain": "ethereum",
  "max_hops": 3,
  "created_at": "2026-09-02T04:56:24Z",
  "nodes": [
    {
      "id": "0x...",
      "hop": 0,
      "risk_tag": "reported | exchange | intermediary | unknown",
      "label": "Binance Hot Wallet | null",
      "exchange_network": "mainnet | sepolia | null",
      "tx_count": 0,
      "total_value_eth": 0.0
    }
  ],
  "edges": [
    { "source": "0x...", "target": "0x...", "tx_hash": "0x...", "value_eth": 0.5, "timestamp": 1234567890, "hop": 1 }
  ],
  "flagged_exchange": { "...": "same shape as a node, or null" },
  "summary": "Traced ... exchange deposit detected."
}
```

**Errors**
- `400` - invalid wallet address format
- `502` - `ETHERSCAN_API_KEY` not configured, or the Etherscan API call failed

## `GET /cases`

List all cases (case history), newest first.

```json
[
  {
    "case_id": "uuid",
    "wallet_address": "0x...",
    "chain": "ethereum",
    "created_at": "2026-09-02T04:56:24Z",
    "flagged_exchange_label": "Binance Hot Wallet | null",
    "status": "complete"
  }
]
```

## `GET /case/{case_id}`

Full case detail - same shape as the `POST /trace` response. `404` if not found.

## `GET /report/{case_id}?format=html|pdf`

Renders the investigation report for a case. `format=html` (default) returns
an HTML page; `format=pdf` returns a PDF if `weasyprint` is installed,
otherwise falls back to HTML. `404` if the case doesn't exist.

## `GET /health`

Liveness check - `{"status": "ok"}`.
