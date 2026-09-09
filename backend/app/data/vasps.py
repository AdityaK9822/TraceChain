"""VASP (exchange) registry for attribution.

Replaces the old flat `known_exchange_wallets.json`. The important structural
change is that a VASP is an *entity* that owns hot wallets on several chains -
so we can express the real-world two-step: a fraudster deposits into a unique,
unlabelled **deposit address**, and that address later sweeps into the VASP's
**hot wallet**. Seeing the sweep is what lets us attribute the deposit address
to the VASP, which is the address an LEA actually serves for KYC records.

Hot-wallet addresses are synthetic (see data/addresses.py) - these are not the
real published hot wallets of these companies.
"""

from app.data.addresses import synth_address

VASPS = [
    {
        "vasp_id": "binance",
        "name": "Binance",
        "jurisdiction": "Seychelles (global)",
        "kyc_contact": "Law Enforcement Request System (LERS)",
        "response_sla_days": 14,
        "chains": ["ethereum", "bsc", "bitcoin", "tron"],
    },
    {
        "vasp_id": "wazirx",
        "name": "WazirX",
        "jurisdiction": "India (FIU-IND registered)",
        "kyc_contact": "Nodal Officer, WazirX (Zanmai Labs)",
        "response_sla_days": 7,
        "chains": ["ethereum", "polygon", "tron"],
    },
    {
        "vasp_id": "coindcx",
        "name": "CoinDCX",
        "jurisdiction": "India (FIU-IND registered)",
        "kyc_contact": "Nodal Officer, CoinDCX (Neblio Technologies)",
        "response_sla_days": 7,
        "chains": ["ethereum", "bitcoin", "polygon"],
    },
    {
        "vasp_id": "coinbase",
        "name": "Coinbase",
        "jurisdiction": "United States (FinCEN MSB)",
        "kyc_contact": "Coinbase Law Enforcement Portal",
        "response_sla_days": 21,
        "chains": ["ethereum", "bitcoin", "solana"],
    },
    {
        "vasp_id": "bybit",
        "name": "Bybit",
        "jurisdiction": "Dubai (VARA)",
        "kyc_contact": "Bybit Compliance / LE Desk",
        "response_sla_days": 21,
        "chains": ["ethereum", "tron", "solana"],
    },
]


def hot_wallet(vasp_id: str, chain: str) -> str:
    """The synthetic hot-wallet address for a VASP on a chain."""
    return synth_address(chain, f"vasp:{vasp_id}:hot")


def _build_index() -> dict[tuple[str, str], dict]:
    index: dict[tuple[str, str], dict] = {}
    for vasp in VASPS:
        for chain in vasp["chains"]:
            address = hot_wallet(vasp["vasp_id"], chain)
            index[(chain, address.lower())] = {
                **{k: v for k, v in vasp.items() if k != "chains"},
                "chain": chain,
                "hot_wallet": address,
            }
    return index


HOT_WALLET_INDEX = _build_index()


def match_hot_wallet(address: str, chain: str) -> dict | None:
    """Return the VASP owning this hot wallet, or None."""
    if not address:
        return None
    return HOT_WALLET_INDEX.get((chain, address.lower()))


def get_vasp(vasp_id: str) -> dict | None:
    for vasp in VASPS:
        if vasp["vasp_id"] == vasp_id:
            return vasp
    return None
