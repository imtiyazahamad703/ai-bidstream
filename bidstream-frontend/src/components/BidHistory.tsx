import React from 'react';
import { Bid } from '../api/bidApi';

interface BidHistoryProps {
  bids: Bid[];
}

const BidHistory: React.FC<BidHistoryProps> = ({ bids }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 bg-slate-900/50">
        <h3 className="font-semibold text-white">Bid History</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {bids.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">No bids placed yet.</div>
        ) : (
          bids.map((bid, index) => (
            <div 
              key={bid.id} 
              className={`p-3 rounded-lg border ${
                index === 0 
                  ? 'bg-indigo-900/20 border-indigo-500/30' 
                  : 'bg-slate-900/50 border-slate-700/50'
              } flex justify-between items-center`}
            >
              <div>
                <span className="text-slate-300 text-sm font-medium">
                  Bidder: {bid.bidderEmail ? bid.bidderEmail.split('@')[0] : 'Anonymous'}
                </span>
                <div className="text-xs text-slate-500 mt-1">
                  {bid.createdAt ? new Date(bid.createdAt).toLocaleTimeString() : 'Just now'}
                </div>
              </div>
              <div className={`font-bold ${index === 0 ? 'text-indigo-400' : 'text-slate-300'}`}>
                ${bid.amount.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BidHistory;
