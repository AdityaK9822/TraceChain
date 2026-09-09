"use client";

import { useEffect, useState } from "react";
import ChainBadge from "../ChainBadge/ChainBadge";
import { getComplaintFeed } from "../../lib/api";

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(hours) {
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function LiveFeed({ onSelectAddress }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getComplaintFeed()
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load feed");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white/5 h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {reports.map((report) => (
        <button
          key={report.report_id}
          onClick={() => onSelectAddress(report.address, report.chain)}
          className="w-full text-left rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-4 transition-all hover:border-blue-500/30 group"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-semibold border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                LIVE
              </span>
              <ChainBadge chain={report.chain} size="sm" />
            </div>
            <span className="text-[11px] text-white/40 font-mono">
              {timeAgo(report.hours_ago)}
            </span>
          </div>

          <div className="mb-2">
            <p className="text-sm font-medium text-white/90 mb-1">{report.fraud_type}</p>
            <p className="text-xs text-white/50 font-mono truncate">{report.address}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white/80">{formatINR(report.amount_inr)}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/40">{report.state}</span>
              {report.repeat_offender && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Repeat Offender
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
