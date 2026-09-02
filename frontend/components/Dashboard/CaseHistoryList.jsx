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
    <div className="rounded-lg border border-border-subtle bg-bg-panel p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-3">Case history</h2>
      {cases.length === 0 ? (
        <p className="text-sm text-text-secondary">No cases traced yet.</p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {cases.map((c) => (
            <li key={c.case_id} className="py-2.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link href={`/case/${c.case_id}`} className="mono text-sm text-accent-blue hover:underline truncate block">
                  {c.wallet_address}
                </Link>
                <p className="text-xs text-text-secondary">{formatDate(c.created_at)}</p>
              </div>
              {c.flagged_exchange_label ? (
                <span className="shrink-0 text-xs font-medium text-accent-red">{c.flagged_exchange_label}</span>
              ) : (
                <span className="shrink-0 text-xs text-text-secondary">unresolved</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
