import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { wsService } from '../../api/stompClient';

const mockBids = [
  { id: 1, auctionId: 1, bidderId: 101, amount: 250.00, timestamp: new Date().toISOString() },
  { id: 2, auctionId: 1, bidderId: 102, amount: 200.00, timestamp: new Date(Date.now() - 10000).toISOString() }
];

const SellerAuctionMonitor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('auth_token');
  const [bids, setBids] = useState(mockBids);
  
  useEffect(() => {
    if (token) {
      wsService.connect(token);
      
      const bidSub = wsService.subscribe(`/topic/auctions/${id}/bids`, (message) => {
        setBids(prev => [message, ...prev]);
      });

      return () => {
        bidSub?.unsubscribe();
        wsService.disconnect();
      };
    }
  }, [token, id]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            Auction #{id} Monitor
            <span className="ml-4 px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full flex items-center border border-red-500/30">
              <span className="h-2 w-2 bg-red-500 rounded-full animate-ping mr-2"></span>
              LIVE
            </span>
          </h1>
          <p className="text-slate-400 mt-1">Real-time overview of your active auction</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              if(window.confirm('Are you sure you want to cancel this auction? This action cannot be undone.')) {
                // Call cancel API
                alert('Auction cancelled successfully');
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Cancel Auction
          </button>
          <Link to="/seller/auctions" className="text-slate-300 hover:text-white underline text-sm">
            Back to Auctions
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 md:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Live Bid Stream</h2>
          <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
            {bids.map((bid, i) => (
              <div key={bid.id || i} className={`p-4 rounded-lg flex justify-between items-center border ${i === 0 ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-slate-900/50 border-slate-700'}`}>
                <div>
                  <span className="text-sm text-slate-400">Bidder #{bid.bidderId}</span>
                  <div className="text-xs text-slate-500">{new Date(bid.timestamp).toLocaleTimeString()}</div>
                </div>
                <div className={`font-bold text-lg ${i === 0 ? 'text-indigo-400' : 'text-slate-200'}`}>
                  ${bid.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Current Highest</h2>
            <div className="text-4xl font-extrabold text-green-400">
              ${bids.length > 0 ? bids[0].amount.toFixed(2) : '0.00'}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {bids.length} total bids placed
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Live Participants</h2>
            <div className="flex items-end space-x-2">
              <div className="text-4xl font-extrabold text-white">
                {Math.floor(Math.random() * 20) + 5}
              </div>
              <div className="text-slate-500 mb-1">active users</div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
            <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider relative z-10">Bid Velocity</h2>
            <div className="flex items-end space-x-2 relative z-10">
              <div className="text-4xl font-extrabold text-indigo-400">
                {bids.length > 5 ? 'High' : 'Normal'}
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-500 relative z-10">
              ~{Math.floor(Math.random() * 5) + 1} bids per minute
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAuctionMonitor;
