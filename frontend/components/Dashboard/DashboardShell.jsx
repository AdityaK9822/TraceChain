import Link from "next/link";

export default function DashboardShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-rose-500/30 selection:text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/TraceChainlogo.png" alt="TraceChain" className="h-8 w-auto" />
            <span className="text-white/50 font-normal ml-3">LEA</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span className="hidden sm:inline">Investigator Console</span>
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="System online" />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      <footer className="border-t border-white/10 py-6 mt-12 bg-black">
        <div className="mx-auto max-w-6xl px-6 text-xs text-white/40 flex justify-between">
          <span>TraceChain LEA — Connected Mode</span>
          <span>SIH PS 26183 demo build</span>
        </div>
      </footer>
    </div>
  );
}
