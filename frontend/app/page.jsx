"use client";

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30 selection:text-white overflow-x-hidden relative font-sans">
      {/* Background gradients for the Apple-like "curve" and depth effect */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-[#1a1a2e] to-black opacity-50 pointer-events-none" />
      <div className="absolute -top-[400px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#000_10%] to-transparent opacity-80 blur-[80px] pointer-events-none" />
      
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <img src="/TraceChainlogo.png" alt="TraceChain" className="h-14 w-auto" />
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/connect')}
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:scale-105 hover:bg-gray-100 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Trace my wallet
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center px-4">
        <div className="max-w-4xl mx-auto space-y-8 mt-[-10vh]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 shadow-xl opacity-0 animate-fade-in-up">
            <span className="flex w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm text-white/80 font-medium tracking-wide">TraceChain LEA Console</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 opacity-0 animate-fade-in-up delay-100">
            Uncover the invisible.
          </h1>
          
          <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed opacity-0 animate-fade-in-up delay-200">
            Advanced blockchain tracing designed for law enforcement. Follow the money hop-by-hop and unmask the deposit address.
          </p>

          <div className="pt-8 opacity-0 animate-fade-in-up delay-300">
            <button 
              onClick={() => router.push('/connect')}
              className="px-8 py-4 bg-white text-black text-lg font-semibold rounded-full hover:scale-105 hover:bg-gray-100 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Start Tracing
            </button>
          </div>
        </div>

        {/* Decorative UI element for the "curve" look (Apple style hardware curve suggestion) */}
        <div className="absolute bottom-0 w-full flex justify-center pointer-events-none animate-float">
          <div className="w-[150%] h-[400px] border-t border-white/10 rounded-t-[100%] bg-gradient-to-b from-white/[0.02] to-transparent animate-glow-pulse" />
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
