import Link from "next/link";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function CaseHistoryList({ cases = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
      <h2 className="text-sm font-semibold text-white mb-4">Case history</h2>
      {cases.length === 0 ? (
        <p className="text-sm text-white/50">No cases traced yet.</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {cases.map((c) => (
            <li key={c.case_id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link href={`/case/${c.case_id}`} className="font-mono text-sm text-rose-500 hover:text-rose-400 hover:underline truncate block transition-colors">
                  {c.wallet_address}
                </Link>
                <p className="text-xs text-white/40 mt-1">{formatDate(c.created_at)}</p>
              </div>
              {c.flagged_exchange_label ? (
                <span className="shrink-0 text-xs font-medium text-rose-500">{c.flagged_exchange_label}</span>
              ) : (
                <span className="shrink-0 text-xs text-white/40">unresolved</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
