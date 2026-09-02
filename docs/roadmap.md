# Roadmap (not built in v1)

Explicitly out of scope for the hackathon build - mentioned in the pitch as
"here's how this scales," not demoed live.

- **Cross-chain / multi-blockchain tracing** - following funds across a
  bridge from Ethereum to another chain.
- **Mixer / tumbler & DeFi protocol detection** - pattern-based heuristics
  to flag when funds pass through a mixing service or DeFi protocol
  (swaps, liquidity pools) rather than a simple wallet-to-wallet transfer.
- **Real SAHYOG/NCRP integration** - the complaint feed is mocked
  (`sample-data/mock_sahyog_complaint.json`); a real integration means an
  actual intake API/webhook.
- **ML-based risk scoring** - v1 uses a rule-based "v1 heuristic engine"
  (`backend/app/core/risk_engine.py`); a real model would need labeled
  fraud-flow training data we don't have yet.
- **Real exchange wallet data on mainnet as the live demo path** - the known
  exchange list includes real mainnet addresses for reference, but the
  guaranteed live demo runs on Sepolia testnet against self-created wallets
  (see [data-sources.md](./data-sources.md)) so it isn't dependent on an
  actual scammer moving funds during the demo window.
- **Auth / role management** - "Admin/Analyst" role (managing the known
  exchange list, viewing all cases) is a stretch goal, not built.
