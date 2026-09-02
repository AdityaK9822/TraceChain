"use client";

import { useParams, useRouter } from "next/navigation";
import DashboardShell from "../../../components/Dashboard/DashboardShell";
import { reportUrl } from "../../../lib/api";

export default function ReportPage() {
  const { caseId } = useParams();
  const router = useRouter();

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={() => router.back()} className="text-sm text-accent-blue hover:underline">
            ← Back to case
          </button>
          <h1 className="text-xl font-semibold text-text-primary mt-2">Investigation Report</h1>
        </div>
        <a
          href={reportUrl(caseId, "pdf")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:bg-accent-blue-dim"
        >
          Download PDF
        </a>
      </div>

      <div className="rounded-lg border border-border-subtle bg-white overflow-hidden" style={{ height: "80vh" }}>
        <iframe
          src={reportUrl(caseId, "html")}
          title="Investigation report"
          className="w-full h-full border-0"
        />
      </div>
    </DashboardShell>
  );
}
