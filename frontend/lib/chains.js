// Display-side mirror of the backend chain registry (backend/app/core/chains.py).
// Only presentation concerns live here - colours, labels and explorer links.
// Validation still happens server-side; the client check is just to catch
// obvious typos before firing a request.

export const CHAINS = {
  ethereum: {
    label: "Ethereum",
    symbol: "ETH",
    color: "#627EEA",
    explorer: "https://etherscan.io",
    pattern: /^0x[a-fA-F0-9]{40}$/,
  },
  bitcoin: {
    label: "Bitcoin",
    symbol: "BTC",
    color: "#F7931A",
    explorer: "https://mempool.space",
    pattern: /^(bc1[02-9ac-hj-np-z]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  },
  tron: {
    label: "Tron",
    symbol: "USDT",
    color: "#EF0027",
    explorer: "https://tronscan.org/#",
    pattern: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  },
  bsc: {
    label: "BNB Chain",
    symbol: "BNB",
    color: "#F3BA2F",
    explorer: "https://bscscan.com",
    pattern: /^0x[a-fA-F0-9]{40}$/,
  },
  polygon: {
    label: "Polygon",
    symbol: "POL",
    color: "#8247E5",
    explorer: "https://polygonscan.com",
    pattern: /^0x[a-fA-F0-9]{40}$/,
  },
  solana: {
    label: "Solana",
    symbol: "SOL",
    color: "#14F195",
    explorer: "https://solscan.io",
    pattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  },
};

export const DEFAULT_CHAIN = "ethereum";

export function getChain(chain) {
  return CHAINS[chain] || CHAINS[DEFAULT_CHAIN];
}

export function chainSymbol(chain) {
  return getChain(chain).symbol;
}

/** Infer a chain from an address shape. EVM chains share a format, so a 0x
 *  address always resolves to ethereum - pass the chain explicitly when known. */
export function detectChain(address) {
  if (!address) return null;
  const trimmed = address.trim();
  if (CHAINS.ethereum.pattern.test(trimmed)) return "ethereum";
  for (const name of ["bitcoin", "tron", "solana"]) {
    if (CHAINS[name].pattern.test(trimmed)) return name;
  }
  return null;
}

export function isValidAddress(address, chain) {
  if (!address) return false;
  return getChain(chain).pattern.test(address.trim());
}

export function explorerAddressUrl(address, chain) {
  return `${getChain(chain).explorer}/address/${address}`;
}

export function explorerTxUrl(txHash, chain) {
  return `${getChain(chain).explorer}/tx/${txHash}`;
}

export function shortAddr(address, lead = 6, tail = 4) {
  if (!address) return "";
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function formatValue(value, chain) {
  const amount = Number(value) || 0;
  const decimals = amount >= 1000 ? 0 : amount >= 1 ? 4 : 6;
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${chainSymbol(chain)}`;
}
