import { MOCK_COMPLAINTS } from "../../lib/mockComplaints";

function formatInr(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default function ComplaintFeed({ onSelectAddress }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">Incoming complaints</h2>
        <span className="text-xs text-text-secondary">simulated NCRP/SAHYOG feed</span>
      </div>
      <ul className="divide-y divide-border-subtle">
        {MOCK_COMPLAINTS.map((c) => (
          <li key={c.complaintId} className="py-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-text-primary font-medium">{c.fraudType}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {c.complaintId} · {c.state} · {formatInr(c.amountReportedInr)}
              </p>
              <p className="mono text-xs text-text-secondary mt-1">{c.reportedWalletAddress}</p>
            </div>
            <button
              onClick={() => onSelectAddress?.(c.reportedWalletAddress)}
              className="shrink-0 rounded-md border border-accent-blue/40 px-3 py-1.5 text-xs font-medium text-accent-blue hover:bg-accent-blue/10"
            >
              Investigate
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
