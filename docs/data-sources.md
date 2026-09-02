# Data Sources

## Blockchain transaction data — Etherscan API

- Get a free key at https://etherscan.io/apis (works for both mainnet and
  Sepolia via the v2 multichain endpoint, `chainid` param).
- Free tier: 5 req/s, ~100k req/day. The backend caches per-address responses
  for 60s (`app/core/blockchain_client.py`) to stay well under that during
  dev and rehearsal.
- Set `ETHERSCAN_API_KEY` and `ETHERSCAN_NETWORK` in `.env` (copy from
  `.env.example`).

## Known exchange wallets — `backend/app/data/known_exchange_wallets.json`

A small curated list of publicly documented exchange hot-wallet addresses
(Binance, Coinbase, Kraken, ...) on **mainnet**, sourced from Etherscan's own
public address labels. These are for realism/roadmap discussion - real
exchanges do not operate hot wallets on Sepolia testnet.

**For the live demo**, the trace must run on Sepolia against wallets you
control, because real exchange deposits can't be produced on a testnet. So:

1. Create 3-4 MetaMask wallets on Sepolia: `A` (reported/victim-facing),
   `B`, optionally `C` (intermediary hops), and `D` (plays the role of the
   "exchange").
2. Fund `A` via a Sepolia faucet (e.g. https://sepoliafaucet.com).
3. Send test ETH `A → B → (C) → D` a few hours before the demo so the chain
   has confirmed transaction history to trace.
4. Add `D`'s address to `known_exchange_wallets.json` with
   `"network": "sepolia"` - replace the
   `0xREPLACE_WITH_DEMO_EXCHANGE_WALLET_1` placeholder entry.
5. Update `sample-data/sample_wallets.json` and
   `frontend/lib/mockComplaints.js` with the real address of `A` so the mock
   complaint feed points at your rehearsed chain.

**Do this well before the demo, not the night before** - Sepolia faucets
rate-limit, and you want time to verify the trace actually surfaces the
"Exchange Deposit Detected" flag before you're on stage.

## Mock complaint feed

`sample-data/mock_sahyog_complaint.json` and `frontend/lib/mockComplaints.js`
simulate an incoming NCRP/SAHYOG complaint. There is no real integration with
either system in v1 - see [roadmap.md](./roadmap.md).
