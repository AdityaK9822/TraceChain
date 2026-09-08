import { MOCK_COMPLAINTS } from "../../lib/mockComplaints";

function formatInr(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default function ComplaintFeed({ onSelectAddress }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Incoming complaints</h2>
        <span className="text-xs text-white/40">simulated NCRP/SAHYOG feed</span>
      </div>
      <ul className="divide-y divide-white/10">
        {MOCK_COMPLAINTS.map((c) => (
          <li key={c.complaintId} className="py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white font-medium">{c.fraudType}</p>
              <p className="text-xs text-white/50 mt-1">
                {c.complaintId} · {c.state} · {formatInr(c.amountReportedInr)}
              </p>
              <p className="font-mono text-xs text-white/40 mt-2">{c.reportedWalletAddress}</p>
            </div>
            <button
              onClick={() => onSelectAddress?.(c.reportedWalletAddress)}
              className="shrink-0 rounded-lg border border-rose-500/40 px-4 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors shadow-[0_0_10px_rgba(225,29,72,0.1)]"
            >
              Investigate
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
