"""Deterministic synthetic addresses for the demo fixtures.

Every address in this prototype is generated here from a stable label, so the
same label always yields the same address across runs and processes. That
keeps the SQLite cases, the scenario specs and the VASP registry consistent
without maintaining a giant hand-written list of literals.

Addresses are well-formed for their chain (they pass
`core.chains.validate_address`) but are NOT real - nothing here corresponds to
an address on any live network.
"""

import hashlib

_BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
_BECH32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"

_EVM_CHAINS = {"ethereum", "bsc", "polygon"}


def _digest(chain: str, label: str) -> str:
    return hashlib.sha256(f"tracechain:{chain}:{label}".encode()).hexdigest()


def _encode(digest: str, alphabet: str, length: int) -> str:
    value = int(digest, 16)
    out = []
    for _ in range(length):
        value, index = divmod(value, len(alphabet))
        out.append(alphabet[index])
    return "".join(out)


def synth_address(chain: str, label: str) -> str:
    """A stable, well-formed fake address for (chain, label)."""
    digest = _digest(chain, label)

    if chain in _EVM_CHAINS:
        return "0x" + digest[:40]
    if chain == "bitcoin":
        return "bc1q" + _encode(digest, _BECH32, 38)
    if chain == "tron":
        return "T" + _encode(digest, _BASE58, 33)
    if chain == "solana":
        return _encode(digest, _BASE58, 44)
    raise ValueError(f"No address format defined for chain '{chain}'")


def synth_tx_hash(chain: str, label: str) -> str:
    """A stable, well-formed fake transaction hash."""
    digest = _digest(chain, f"tx:{label}")
    if chain == "bitcoin":
        return digest  # BTC txids are bare hex
    if chain == "solana":
        return _encode(digest, _BASE58, 88)
    return "0x" + digest
