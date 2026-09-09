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

export function traceWallet({
  walletAddress,
  chain = "ethereum",
  maxHops = 6,
  maxBranchesPerHop = 5,
  direction = "outgoing",
}) {
  return request("/trace", {
    method: "POST",
    body: JSON.stringify({
      wallet_address: walletAddress,
      chain,
      max_hops: maxHops,
      max_branches_per_hop: maxBranchesPerHop,
      direction,
    }),
  });
}

export function traceWalletStream({
  walletAddress,
  chain = "ethereum",
  maxHops = 6,
  maxBranchesPerHop = 5,
  direction = "outgoing",
  signal = null,
  onEvent,
}) {
  return new Promise((resolve, reject) => {
    fetch(`${API_BASE_URL}/trace/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet_address: walletAddress,
        chain,
        max_hops: maxHops,
        max_branches_per_hop: maxBranchesPerHop,
        direction,
      }),
      signal,
    })
    .then(response => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let caseId = null;
      
      function readChunk() {
        reader.read().then(({ done, value }) => {
          if (done) {
            resolve(caseId);
            return;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.substring(6));
                onEvent(eventData);
                
                if (eventData.event === 'init') {
                  caseId = eventData.case_id;
                }
                
                if (eventData.event === 'complete') {
                  resolve(caseId);
                  return;
                }
              } catch (e) {
                console.error('Failed to parse SSE event:', e);
              }
            }
          }
          
          readChunk();
        }).catch(err => {
          if (err.name === 'AbortError') {
            resolve(caseId);
          } else {
            reject(err);
          }
        });
      }
      
      readChunk();
    })
    .catch(error => {
      if (error.name === 'AbortError') {
        resolve(null);
      } else {
        reject(error);
      }
    });
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

export function getComplaintFeed() {
  return request("/feed");
}

export function getWalletBalance(walletAddress, network = "ethereum") {
  return request(`/wallet/${walletAddress}/balance?network=${network}`);
}

export function expandWalletNode({
  walletAddress,
  hop = 0,
  network = "ethereum",
  maxBranches = 5,
  direction = "outgoing",
}) {
  return request("/wallet/expand", {
    method: "POST",
    body: JSON.stringify({
      wallet_address: walletAddress,
      hop,
      network,
      max_branches: maxBranches,
      direction,
    }),
  });
}


