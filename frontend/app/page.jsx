"use client";

import { useRouter } from 'next/navigation';
import { ExpandingArrowButton } from '../components/motion/expanding-arrow-button';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0b10] text-white selection:bg-blue-500/30 selection:text-white overflow-x-hidden relative font-sans">
      {/* Background gradients for premium depth effect */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-[#11131e] to-transparent opacity-90 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent blur-[80px] pointer-events-none" />
      
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <img src="/TraceChainlogo.png" alt="TraceChain" className="h-10 w-auto" />
        </div>
        
        {/* Center Links */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/80">
          <a href="#" className="hover:text-white transition-colors">API</a>
          <a href="#" className="hover:text-white transition-colors">CLI</a>
          <a href="#" className="hover:text-white transition-colors">Premium</a>
          <a href="#" className="hover:text-white transition-colors">Security</a>
          <a href="#" className="hover:text-white transition-colors">Blog</a>
          <a href="#" className="hover:text-white transition-colors">Help</a>
        </div>

        <div className="flex items-center gap-4">
          <ExpandingArrowButton 
            onClick={() => router.push('/connect')}
            className="hidden sm:inline-flex"
            accentClassName="bg-blue-500 text-white"
          >
            Start Tracing
          </ExpandingArrowButton>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-24 lg:pt-16 lg:pb-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Left Column: Text Content */}
        <div className="flex-1 space-y-8 text-center lg:text-left opacity-0 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-tight text-white leading-[1.1]">
            Wallet Tracker<br />
            For All Chains
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
            Effortlessly track illicit funds and analyze portfolios with TraceChain. Connect wallets across multiple EVM blockchains, including Ethereum, Base, Polygon, and more.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <ExpandingArrowButton 
              onClick={() => router.push('/connect')}
              className="w-full sm:w-auto border border-white/10"
              accentClassName="bg-blue-500 text-white"
            >
              Track Any Wallet
            </ExpandingArrowButton>
            
            <ExpandingArrowButton 
              onClick={() => router.push('/connect')}
              className="w-full sm:w-auto bg-transparent border border-white/20"
              accentClassName="bg-white text-black"
            >
              View Live Demo
            </ExpandingArrowButton>
          </div>

          {/* Supported Chains Strip */}
          <div className="pt-8 lg:pt-12 border-t border-white/5 mt-8">
            <p className="text-sm text-white/40 font-medium mb-4 uppercase tracking-wider">Supports over 40+ Blockchains</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 items-center opacity-80 hover:opacity-100 transition-opacity">
              {/* Ethereum */}
              <div className="w-10 h-10 rounded-full bg-[#627EEA] flex items-center justify-center shadow-[0_0_15px_rgba(98,126,234,0.4)]">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="white">
                  <path d="M15.925 23.969L15.89 23.924L7.502 18.966L15.89 31.996L24.316 18.966L15.925 23.969ZM15.925 0L7.502 13.978L15.89 18.966L24.316 13.978L15.925 0ZM15.925 17.525L15.89 17.481L7.502 12.522L15.89 25.553L24.316 12.522L15.925 17.525Z" fill="white"/>
                </svg>
              </div>
              {/* Solana */}
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-[#14F195]/30 shadow-[0_0_15px_rgba(20,241,149,0.3)]">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="url(#solana_grad)">
                  <defs>
                    <linearGradient id="solana_grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00FFA3" />
                      <stop offset="100%" stopColor="#DC1FFF" />
                    </linearGradient>
                  </defs>
                  <path d="M5.38 23.36l4.24-4.24h16.96l-4.24 4.24H5.38zm0-10.61l4.24-4.24h16.96l-4.24 4.24H5.38zm16.96 5.31l-4.24 4.24H1.14l4.24-4.24h16.96z"/>
                </svg>
              </div>
              {/* Polygon */}
              <div className="w-10 h-10 rounded-full bg-[#8247E5] flex items-center justify-center shadow-[0_0_15px_rgba(130,71,229,0.4)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M16.5 13l-4.5 2.6-4.5-2.6V7.8l4.5-2.6 4.5 2.6v5.2zm-9 1.73l-3 1.73v-3.46l3-1.73v3.46zm12 0l-3-1.73v-3.46l3 1.73v3.46zM12 21.6l-3-1.73v-3.46l3 1.73v3.46zM12 4.1l-3-1.73v3.46l3 1.73v-3.46z"/>
                </svg>
              </div>
              {/* Binance */}
              <div className="w-10 h-10 rounded-full bg-[#F3BA2F] flex items-center justify-center shadow-[0_0_15px_rgba(243,186,47,0.4)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.94l3.14 3.14 2.21-2.21-5.35-5.35-5.35 5.35 2.21 2.21L12 2.94zm0 6.64l-2.02 2.02L12 13.62l2.02-2.02L12 9.58zM4.46 10.4l-2.94 2.94 2.94 2.94 2.21-2.21-2.02-2.02 2.02-2.02-2.21-2.21zm15.08 0l-2.21 2.21 2.02 2.02-2.02 2.02 2.21 2.21 2.94-2.94-2.94-2.94zm-7.54 3.22L9.98 15.64 12 17.66l2.02-2.02-2.02-2.02zm0 4.04l-3.14-3.14-2.21 2.21 5.35 5.35 5.35-5.35-2.21-2.21L12 17.66z"/>
                </svg>
              </div>
              <span className="text-white/40 text-sm ml-2 font-medium bg-white/5 px-3 py-1.5 rounded-full">+36 More</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mobile App / Dashboard Image */}
        <div className="flex-1 flex justify-center lg:justify-end relative w-full opacity-0 animate-fade-in-up delay-200">
          <div className="relative w-full max-w-[320px] md:max-w-[380px] lg:max-w-[420px]">
            {/* Subtle glow behind the image */}
            <div className="absolute inset-0 bg-blue-500/30 blur-[80px] rounded-full mix-blend-screen opacity-70 pointer-events-none"></div>
            
            <img 
              src="/Landing.png" 
              alt="TraceChain Interface" 
              className="relative z-10 w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:-translate-y-2 transition-transform duration-700" 
            />
          </div>
        </div>
      </main>

      {/* Platform Info Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-24 flex flex-col md:flex-row items-center gap-16 mt-20">
        {/* Left Side: Image with Brightness/Glow */}
        <div className="flex-[1.5] relative group w-full">
          {/* Glowing effect behind image */}
          <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full mix-blend-screen opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>
          <img 
            src="/TraceBG.png" 
            alt="Platform visualization" 
            className="relative z-10 w-full h-auto rounded-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform hover:scale-[1.02] transition-transform duration-500 brightness-110" 
          />
        </div>
        
        {/* Right Side: Text Content */}
        <div className="flex-1 space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            See beyond the blocks.
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed font-light">
            Our platform provides state-of-the-art tools to seamlessly trace cryptocurrency transactions across multiple blockchains. 
            Identify illicit activity, track stolen funds with hop-by-hop analysis, and uncover the true identities behind anonymous addresses.
          </p>
          <div className="pt-4">
            <button className="text-gray-300 hover:text-white font-medium flex items-center gap-2 group transition-colors">
              Learn more about our technology 
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Beautiful Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-20 bg-gradient-to-b from-transparent to-black pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/TraceChainlogo.png" alt="TraceChain" className="h-8 w-auto opacity-70" />
            <span className="text-gray-400 font-medium">TraceChain LEA</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
          <div className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} TraceChain. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
