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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl mb-12">
            <button onClick={() => handleConnect('Binance')} className="group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-[#121212] border border-white/5 hover:bg-[#1a1a1a] hover:border-white/20 transition-all hover:-translate-y-1">
              <div className="w-20 h-20 flex items-center justify-center mb-6">
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fc/Binance-coin-bnb-logo.png" alt="Binance" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <span className="text-white font-medium mb-2 text-lg">Binance</span>
              <span className="text-white/40 text-sm group-hover:text-white flex items-center gap-1 transition-colors">
                Connect <span>&rarr;</span>
              </span>
            </button>

            <button onClick={() => handleConnect('MetaMask')} className="group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-[#121212] border border-white/5 hover:bg-[#1a1a1a] hover:border-white/20 transition-all hover:-translate-y-1">
              <div className="w-20 h-20 flex items-center justify-center mb-6">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <span className="text-white font-medium mb-2 text-lg">MetaMask</span>
              <span className="text-white/40 text-sm group-hover:text-white flex items-center gap-1 transition-colors">
                Connect <span>&rarr;</span>
              </span>
            </button>

            <button onClick={() => handleConnect('OKX Wallet')} className="group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-[#121212] border border-white/5 hover:bg-[#1a1a1a] hover:border-white/20 transition-all hover:-translate-y-1">
              <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center mb-6 overflow-hidden border border-white/10">
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/14/OKX_Logo.svg" alt="OKX" className="w-16 h-16 object-contain" />
              </div>
              <span className="text-white font-medium mb-2 text-lg">OKX Wallet</span>
              <span className="text-white/40 text-sm group-hover:text-white flex items-center gap-1 transition-colors">
                Connect <span>&rarr;</span>
              </span>
            </button>

            <button onClick={() => setIsModalOpen(true)} className="group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-[#121212] border border-white/5 hover:bg-[#1a1a1a] hover:border-white/20 transition-all hover:-translate-y-1">
              <div className="w-20 h-20 flex items-center justify-center mb-6 opacity-80">
                <OtherWalletIcon className="w-12 h-12 text-white" />
              </div>
              <span className="text-white font-medium mb-2 text-lg">Other</span>
              <span className="text-white/40 text-sm group-hover:text-white flex items-center gap-1 transition-colors">
                Connect <span>&rarr;</span>
              </span>
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
