import React from 'react';
import { Bot, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-slate-950 text-slate-200 min-h-screen pt-4 transition-colors duration-300">
      {/* Hero Section */}
      <section className="w-full bg-slate-950 pt-16 pb-16 text-center relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]"></div>
        <div className="container mx-auto px-6 lg:px-16 relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide text-white mb-6 transition-colors">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-300">BidStream</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed transition-colors">
            The next generation of high-stakes live auctions. We use cutting-edge WebSocket streams and AI provenance verification to deliver a fast, secure, and authentic bidding experience.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 lg:px-16 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-12 transition-colors">Our Mission</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-slate-900 border border-slate-800 hover:-translate-y-2 transition-transform p-8 flex flex-col items-center rounded-2xl shadow-xl">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-white font-semibold text-xl mb-4 transition-colors">Real-Time Bidding</h3>
            <p className="text-slate-400 text-sm transition-colors">Zero-lag WebSocket infrastructure ensures that every bid is broadcast instantly across the globe with robust anti-sniping protection.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 hover:-translate-y-2 transition-transform p-8 flex flex-col items-center rounded-2xl shadow-xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-white font-semibold text-xl mb-4 transition-colors">AI Fact-Checking</h3>
            <p className="text-slate-400 text-sm transition-colors">Our AI Auctioneer instantly analyzes uploaded certificates and appraisal reports to verify authenticity before you bid.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 hover:-translate-y-2 transition-transform p-8 flex flex-col items-center rounded-2xl shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-white font-semibold text-xl mb-4 transition-colors">Secure Escrow</h3>
            <p className="text-slate-400 text-sm transition-colors">All winning funds remain safely locked in verified multi-sig escrow until the physical asset is delivered and certified.</p>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-slate-950 border-t border-slate-800 py-16 text-center mt-12 transition-colors">
        <h2 className="text-3xl font-extrabold text-white mb-4 transition-colors">Ready to Bid?</h2>
        <p className="max-w-2xl mx-auto mb-8 text-slate-400 transition-colors">
          Join BidStream today and participate in the most exclusive live auctions on the web.
        </p>
        <Link 
          to="/register"
          className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors inline-block"
        >
          Create an Account
        </Link>
      </section>
    </div>
  );
};

export default AboutPage;
