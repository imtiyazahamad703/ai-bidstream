import React from 'react';
import { Gavel, ShieldCheck, Zap, Bot, Radio, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 text-slate-400 text-xs mt-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-8">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white font-bold shadow-md">
                <Gavel className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                Bid<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-400">Stream</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Discover and bid on exclusive, high-value items in real-time. BidStream provides a secure, transparent, and exhilarating live auction experience powered by intelligent AI assistance.
            </p>
          </div>

          {/* Company Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/about" className="hover:text-white transition-colors cursor-pointer inline-block">About Us</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors cursor-pointer inline-block">How It Works</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors cursor-pointer inline-block">Contact Support</Link></li>
            </ul>
          </div>

          {/* Trust & Security */}
          <div className="md:col-span-5 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Trust & Security</h4>
            <div className="space-y-2 text-[11px] text-slate-400">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Secure Escrow:</strong> 100% of winning auction funds are held in secure escrow until physical receipt & condition inspection.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Verified Authenticity:</strong> Our AI Auctioneer analyzes and verifies information sourced directly from the seller's uploaded certificates and provenance documents.
                </span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <span>© 2026 BidStream Auctions. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
