// Mirrors sample-data/mock_sahyog_complaint.json. Simulates an incoming
// NCRP/SAHYOG complaint feed for the demo - not a live integration.
export const MOCK_COMPLAINTS = [
  {
    complaintId: "NCRP-2026-0417233",
    receivedAt: "2026-09-01T06:12:00Z",
    fraudType: "Investment/Trading Scam",
    amountReportedInr: 480000,
    state: "Maharashtra",
    reportedWalletAddress: "0xREPLACE_WALLET_A",
    description:
      "Victim lured into a fake crypto trading app promising guaranteed returns; funds converted and moved out by the scammer.",
  },
  {
    complaintId: "NCRP-2026-0418901",
    receivedAt: "2026-09-01T09:47:00Z",
    fraudType: "Sextortion / Blackmail",
    amountReportedInr: 125000,
    state: "Karnataka",
    reportedWalletAddress: "0xREPLACE_WALLET_A",
    description: "Victim coerced into paying crypto ransom to avoid release of private material.",
  },
];
