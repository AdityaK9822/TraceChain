import pytest

from app.core.chains import (
    UnknownChainError,
    chain_symbol,
    detect_chain,
    explorer_tx_url,
    get_chain,
    validate_address,
)

EVM = "0x28c6c06298d514db089934071355e5743bf21d60"
BTC = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
TRON = "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf"


def test_evm_address_valid_on_every_evm_chain():
    for chain in ("ethereum", "bsc", "polygon"):
        assert validate_address(EVM, chain)


def test_evm_address_rejected_on_non_evm_chain():
    assert not validate_address(EVM, "bitcoin")
    assert not validate_address(EVM, "tron")


def test_native_formats_validate_on_their_own_chain():
    assert validate_address(BTC, "bitcoin")
    assert validate_address(TRON, "tron")


def test_malformed_addresses_rejected():
    assert not validate_address("0xtooshort", "ethereum")
    assert not validate_address("", "ethereum")
    assert not validate_address(None, "ethereum")


def test_unknown_chain_is_not_valid_rather_than_raising():
    assert not validate_address(EVM, "dogecoin")


def test_get_chain_raises_on_unknown():
    with pytest.raises(UnknownChainError):
        get_chain("dogecoin")


def test_symbols_are_chain_specific():
    assert chain_symbol("ethereum") == "ETH"
    assert chain_symbol("bitcoin") == "BTC"
    # Tron fraud flows are USDT-TRC20, not native TRX.
    assert chain_symbol("tron") == "USDT"


def test_detect_chain_infers_non_evm_formats():
    assert detect_chain(BTC) == "bitcoin"
    assert detect_chain(TRON) == "tron"
    # EVM chains are indistinguishable by format, so 0x resolves to ethereum.
    assert detect_chain(EVM) == "ethereum"
    assert detect_chain("not-an-address") is None


def test_explorer_urls_are_per_chain():
    assert "etherscan.io" in explorer_tx_url("0xabc", "ethereum")
    assert "tronscan" in explorer_tx_url("0xabc", "tron")
