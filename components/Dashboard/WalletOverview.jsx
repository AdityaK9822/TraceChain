"use client";

import React, { useState, useEffect } from "react";
import { getWalletOverview } from "../../lib/api";

export default function WalletOverview({ walletAddress, onTraceClick }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!walletAddress) return;

    let isMounted = true;
    setLoading(true);
    setError("");

    getWalletOverview(walletAddress)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to fetch wallet data");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white/5 border border-white/10 text-center animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-white mb-2">No Wallet Connected</h2>
        <p className="text-white/50 mb-6">Search for a wallet address or connect your own to view real-time data.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white/5 border border-white/10 text-center animate-in fade-in duration-500">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white/70">Fetching real-time data from blockchain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center animate-in fade-in duration-500">
        <p className="text-rose-400 font-medium">{error}</p>
      </div>
    );
  }

  const balanceEth = data?.balance || 0;
  // Estimate USD value (mock conversion for demo purposes)
  const ethPrice = 2400; 
  const totalBalanceUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balanceEth * ethPrice);
  
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Wallet Overview</h2>
          <p className="text-white/50 text-sm mt-1 font-mono">{walletAddress}</p>
        </div>
        <button
          onClick={onTraceClick}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Trace this wallet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="md:col-span-1 p-6 rounded-2xl bg-[#0a0a0a] border border-white/5 flex flex-col justify-center">
          <span className="text-white/40 text-sm font-medium uppercase tracking-wider mb-2">Total Balance</span>
          <span className="text-4xl font-bold text-white tracking-tighter truncate">{totalBalanceUsd}</span>
          
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  E
                </div>
                <span className="text-white/80 font-medium">ETH</span>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">{balanceEth.toFixed(4)}</div>
                <div className="text-white/40 text-xs">{totalBalanceUsd}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Card */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-[#0a0a0a] border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            <span className="text-white/40 text-sm">{transactions.length} found</span>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {transactions.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No recent transactions</p>
            ) : (
              transactions.map((tx, idx) => {
                const isSend = tx.from.toLowerCase() === walletAddress.toLowerCase();
                const type = isSend ? "Send" : "Receive";
                const peerAddress = isSend ? tx.to : tx.from;
                const formattedDate = new Date(tx.timestamp * 1000).toLocaleString(undefined, { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
                
                return (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-default group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSend ? 'bg-rose-500/20 text-rose-500' : 'bg-green-500/20 text-green-500'}`}>
                        {isSend ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-medium truncate">{type} {isSend ? 'to' : 'from'} <span className="font-mono text-white/70">{peerAddress.slice(0,6)}...{peerAddress.slice(-4)}</span></div>
                        <div className="text-white/40 text-xs mt-1 truncate">{formattedDate} • <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">{tx.hash.slice(0,8)}...</a></div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-semibold ${isSend ? 'text-white' : 'text-green-400'}`}>
                        {isSend ? '-' : '+'}{tx.value_eth.toFixed(4)} ETH
                      </div>
                      <div className="text-white/40 text-xs mt-1">Confirmed</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
