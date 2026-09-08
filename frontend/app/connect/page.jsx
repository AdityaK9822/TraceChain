"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { OtherWalletIcon } from '../../components/Icons';
import Link from 'next/link';
import OtherWalletsModal from '../../components/OtherWalletsModal';

export default function ConnectPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");

  const handleConnect = async (walletName) => {
    if (walletName === 'MetaMask') {
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts.length > 0) {
            router.push(`/console?wallet=${accounts[0]}`);
          } else {
            router.push('/console');
          }
        } catch (err) {
          console.error("MetaMask connection failed", err);
          alert("Connection cancelled or failed.");
        }
      } else {
        alert("MetaMask extension not found! Please install MetaMask.");
      }
    } else {
      router.push('/console');
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      router.push(`/console?wallet=${searchInput.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#000] text-white flex flex-col font-sans">
      
      {/* Simple Header */}
      <nav className="flex items-center px-8 py-6">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img src="/TraceChainlogo.png" alt="TraceChain" className="h-10 w-auto" />
        </Link>
      </nav>

      {/* Main Content matching the CoinStats modal design */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl flex flex-col items-center">
          {/* Background glow effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center tracking-tight mb-4 max-w-2xl">
            The Ultimate Crypto Tracker for Your Wallets & Exchanges
          </h2>
          <p className="text-white/60 text-lg text-center mb-12 max-w-xl">
            Connect your entire portfolio to track, buy, swap, and stake your assets.
          </p>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl mb-12">
            
            {/* Binance */}
            <button onClick={() => handleConnect('Binance')} className="group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-[#111218] border border-white/5 hover:bg-[#161822] hover:border-white/10 transition-all hover:-translate-y-1 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-[#F3BA2F] flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(243,186,47,0.4)] transition-transform duration-300 group-hover:scale-110">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.94l3.14 3.14 2.21-2.21-5.35-5.35-5.35 5.35 2.21 2.21L12 2.94zm0 6.64l-2.02 2.02L12 13.62l2.02-2.02L12 9.58zM4.46 10.4l-2.94 2.94 2.94 2.94 2.21-2.21-2.02-2.02 2.02-2.02-2.21-2.21zm15.08 0l-2.21 2.21 2.02 2.02-2.02 2.02 2.21 2.21 2.94-2.94-2.94-2.94zm-7.54 3.22L9.98 15.64 12 17.66l2.02-2.02-2.02-2.02zm0 4.04l-3.14-3.14-2.21 2.21 5.35 5.35 5.35-5.35-2.21-2.21L12 17.66z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-base mb-1">Binance</span>
              <span className="text-white/40 text-xs group-hover:text-white flex items-center gap-1 transition-colors">Connect &rarr;</span>
            </button>

            {/* MetaMask */}
            <button onClick={() => handleConnect('MetaMask')} className="group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-[#111218] border border-white/5 hover:bg-[#161822] hover:border-white/10 transition-all hover:-translate-y-1 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#FFF2E5] to-[#FFE0C2] flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(246,133,27,0.3)] transition-transform duration-300 group-hover:scale-110">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-10 h-10 object-contain drop-shadow-sm" />
              </div>
              <span className="text-white font-medium text-base mb-1">MetaMask</span>
              <span className="text-white/40 text-xs group-hover:text-white flex items-center gap-1 transition-colors">Connect &rarr;</span>
            </button>

            {/* Coinbase Wallet */}
            <button onClick={() => handleConnect('Coinbase')} className="group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-[#111218] border border-white/5 hover:bg-[#161822] hover:border-white/10 transition-all hover:-translate-y-1 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-[#0052FF] flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(0,82,255,0.4)] transition-transform duration-300 group-hover:scale-110">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-base mb-1">Coinbase</span>
              <span className="text-white/40 text-xs group-hover:text-white flex items-center gap-1 transition-colors">Connect &rarr;</span>
            </button>

            {/* Phantom */}
            <button onClick={() => handleConnect('Phantom')} className="group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-[#111218] border border-white/5 hover:bg-[#161822] hover:border-white/10 transition-all hover:-translate-y-1 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-[#AB9FF2] flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(171,159,242,0.4)] transition-transform duration-300 group-hover:scale-110">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="white">
                  <path d="M50 8C26.8 8 8 26.8 8 50s18.8 42 42 42 42-18.8 42-42S73.2 8 50 8zm16.5 56.5c-2.1 4.5-6.8 7.5-11.8 7.5s-9.7-3-11.8-7.5c-2.1-4.5-1.5-9.8 1.5-13.5 1.5-1.8 3.6-2.9 5.8-3.3-1.8-1.5-3-3.6-3-6 0-4.4 3.6-8 8-8s8 3.6 8 8c0 2.4-1.2 4.5-3 6 2.2.4 4.3 1.5 5.8 3.3 3 3.7 3.6 9 1.5 13.5z"/>
                  <circle cx="43" cy="40" r="3" fill="#AB9FF2" />
                  <circle cx="57" cy="40" r="3" fill="#AB9FF2" />
                </svg>
              </div>
              <span className="text-white font-medium text-base mb-1">Phantom</span>
              <span className="text-white/40 text-xs group-hover:text-white flex items-center gap-1 transition-colors">Connect &rarr;</span>
            </button>

            {/* OKX Wallet */}
            <button onClick={() => handleConnect('OKX Wallet')} className="group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-[#111218] border border-white/5 hover:bg-[#161822] hover:border-white/10 transition-all hover:-translate-y-1 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-110 overflow-hidden">
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/14/OKX_Logo.svg" alt="OKX" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-white font-medium text-base mb-1">OKX Wallet</span>
              <span className="text-white/40 text-xs group-hover:text-white flex items-center gap-1 transition-colors">Connect &rarr;</span>
            </button>

            {/* Other Wallet */}
            <button onClick={() => setIsModalOpen(true)} className="group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-[#111218] border border-white/5 hover:bg-[#161822] hover:border-white/10 transition-all hover:-translate-y-1 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(168,85,247,0.4)] transition-transform duration-300 group-hover:scale-110">
                <OtherWalletIcon className="w-8 h-8 text-white" />
              </div>
              <span className="text-white font-medium text-base mb-1">Other</span>
              <span className="text-white/40 text-xs group-hover:text-white flex items-center gap-1 transition-colors">Connect &rarr;</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="w-full max-w-3xl relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search wallet addresses, assets on any blockchain" 
              className="w-full bg-[#121212] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>
      </main>

      {/* Other Wallets Modal */}
      <OtherWalletsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
