import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OtherWalletsModal({ isOpen, onClose }) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');

  if (!isOpen) return null;

  const categories = ['All', 'Perp Dex', 'Exchanges', 'EVMs', 'Solana', 'Cosmos', 'Ton', 'New'];
  
  const wallets = [
    { name: 'Add Any Wallet', icon: '➕', isText: true },
    { name: 'Binance', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Binance-coin-bnb-logo.png' },
    { name: 'MetaMask', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg' },
    { name: 'Phantom', icon: '👻', isText: true },
    { name: 'Coinbase', icon: '🔵', isText: true },
    { name: 'Bitcoin Wallet', icon: '₿', isText: true },
    { name: 'Bitget', icon: '💠', isText: true },
    { name: 'Trust Wallet', icon: '🛡️', isText: true },
    { name: 'Bybit', icon: '⬛', isText: true },
    { name: 'Ethereum', icon: '⬨', isText: true },
    { name: 'Rabby Wallet', icon: '🐰', isText: true },
    { name: 'Ledger', icon: '🔐', isText: true },
    { name: 'Uniswap', icon: '🦄', isText: true },
    { name: 'Crypto.com', icon: '🦁', isText: true },
    { name: 'Exodus', icon: '📦', isText: true },
  ];

  const handleConnect = async (walletName) => {
    if (walletName === 'MetaMask') {
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          router.push('/console');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-3xl border border-[#2a2a2a] bg-[#141414] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex-none p-8 pb-4">
          <div className="flex items-center justify-center mb-6 relative">
            <h2 className="text-3xl font-bold text-white text-center">
              300+ platforms supported
            </h2>
            <button 
              onClick={onClose}
              className="absolute right-0 p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search for platforms, exchanges or wallets" 
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeCategory === cat 
                    ? 'bg-[#2a2a2a] text-white border border-[#444]' 
                    : 'bg-transparent text-white/60 hover:text-white border border-transparent hover:bg-[#222]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto p-8 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {wallets.map((wallet, idx) => (
              <button 
                key={idx}
                onClick={() => handleConnect(wallet.name)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222] hover:border-[#444] transition-all group"
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  {wallet.isText ? (
                    <span className="text-2xl">{wallet.icon}</span>
                  ) : wallet.icon.startsWith('http') ? (
                    <img src={wallet.icon} alt={wallet.name} className={`max-w-full max-h-full ${wallet.isGeneric ? 'opacity-80 grayscale group-hover:grayscale-0' : ''}`} />
                  ) : (
                    <span className="text-xl">{wallet.icon}</span>
                  )}
                </div>
                <span className="text-white/90 font-medium text-sm text-left flex-1 truncate">{wallet.name}</span>
                <svg className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none p-6 border-t border-[#2a2a2a] flex justify-center bg-[#141414]">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#222] hover:bg-[#333] transition-colors border border-[#333]">
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-white/90 font-medium">Add Manual Portfolio</span>
          </button>
        </div>

      </div>
    </div>
  );
}
