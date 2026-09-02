import Link from "next/link";

export default function DashboardShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border-subtle bg-bg-panel">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-accent-blue text-lg">◆</span>
            <span className="font-semibold tracking-tight text-text-primary">
              CryptoTrace <span className="text-text-secondary font-normal">LEA</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span className="hidden sm:inline">Investigator Console</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" title="System online" />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      <footer className="border-t border-border-subtle py-4">
        <div className="mx-auto max-w-6xl px-6 text-xs text-text-secondary">
          CryptoTrace LEA — v1 heuristic engine (rule-based). SIH PS 26183 demo build.
        </div>
      </footer>
    </div>
  );
}
