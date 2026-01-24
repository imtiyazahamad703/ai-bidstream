import React from 'react';
import { Bid } from '../types/auction';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { Trophy, Clock, Fingerprint } from 'lucide-react';

interface BidHistoryProps {
  bids: Bid[];
}

const BidHistory: React.FC<BidHistoryProps> = ({ bids }) => {
  const { user } = useAuthStore();
  const currentUserEmail = user?.email;

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${Math.max(0, seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-xl">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Bid History
        </h3>
        <div className="text-[10px] text-slate-500 font-mono">
          {bids.length} Total Bids
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-900/50 min-h-[300px]">
        {bids.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-2">
            <Trophy className="w-8 h-8" />
            <div className="text-xs font-medium">No bids placed yet</div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {bids.map((bid, index) => {
              const isCurrentUser = bid.bidderEmail === currentUserEmail;
              const isHighest = index === 0;

              return (
                <motion.div 
                  key={bid.id || `temp-${bid.createdAt}-${bid.amount}`}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  layout
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 30,
                    opacity: { duration: 0.2 }
                  }}
                  className={`p-3 rounded-xl border relative overflow-hidden flex justify-between items-center ${
                    isHighest 
                      ? isCurrentUser 
                        ? 'bg-emerald-500/10 border-emerald-500/40' 
                        : 'bg-indigo-500/10 border-indigo-500/30'
                      : 'bg-slate-950 border-slate-800/60 opacity-80'
                  }`}
                >
                  {/* Subtle Background Glow for Highest Bid */}
                  {isHighest && (
                    <div className={`absolute -left-10 w-20 h-full blur-2xl opacity-20 ${isCurrentUser ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                  )}

                  <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isCurrentUser ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {isCurrentUser ? 'You (Winning)' : (bid.bidderName || (bid.bidderEmail ? bid.bidderEmail.split('@')[0] : 'Anonymous'))}
                      </span>
                      {isHighest && !isCurrentUser && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase">
                          Highest
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {bid.createdAt ? timeAgo(bid.createdAt) : 'Just now'}
                      </span>
                      {bid.trackingId && (
                        <span className="flex items-center gap-1 opacity-60">
                          <Fingerprint className="w-3 h-3" />
                          {bid.trackingId.split('-')[2] || bid.trackingId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 text-right">
                    <div className={`font-mono font-bold text-base ${
                      isHighest 
                        ? isCurrentUser ? 'text-emerald-400' : 'text-indigo-400'
                        : 'text-slate-400'
                    }`}>
                      ${bid.amount.toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default BidHistory;
