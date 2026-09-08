const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON - keep statusText
    }
    throw new Error(detail);
  }

  return res.json();
}

export function traceWallet({ walletAddress, chain = "ethereum", maxHops = 3, maxBranchesPerHop = 5 }) {
  return request("/trace", {
    method: "POST",
    body: JSON.stringify({
      wallet_address: walletAddress,
      chain,
      max_hops: maxHops,
      max_branches_per_hop: maxBranchesPerHop,
    }),
  });
}

export function getCase(caseId) {
  return request(`/case/${caseId}`);
}

export function listCases() {
  return request("/cases");
}

export function reportUrl(caseId, format = "html") {
  return `${API_BASE_URL}/report/${caseId}?format=${format}`;
}

export function getWalletOverview(walletAddress, network = "sepolia") {
  return request(`/wallet/${walletAddress}?network=${network}`);
}
