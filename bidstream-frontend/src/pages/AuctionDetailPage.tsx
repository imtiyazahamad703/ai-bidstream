import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auctionApi, Auction } from '../api/auctionApi';
import { itemApi, Item } from '../api/itemApi';
import { useAuthStore } from '../store/useAuthStore';

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const [auction, setAuction] = useState<(Auction & { itemDetails?: Item }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [bidError, setBidError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAuctionDetails = async () => {
      try {
        if (!id) return;
        
        const auctionData = await auctionApi.getAuctionDetails(parseInt(id));
        const itemData = await itemApi.getItemDetails(auctionData.itemId);
        
        setAuction({ ...auctionData, itemDetails: itemData });
        
        // Suggest next bid
        const currentPrice = auctionData.currentBid || auctionData.startingPrice;
        setBidAmount(currentPrice + (currentPrice * 0.05)); // 5% minimum increment suggested
      } catch (err: any) {
        setError('Failed to load auction details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionDetails();
  }, [id]);

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    
    if (!auction) return;
    
    const amount = Number(bidAmount);
    const currentPrice = auction.currentBid || auction.startingPrice;
    
    if (isNaN(amount) || amount <= currentPrice) {
      setBidError(`Bid must be greater than current price ($${currentPrice})`);
      return;
    }

    // Temporary placeholder for bid submission (will be replaced by WebSocket in next commit)
    alert(`This is a placeholder! You attempted to bid $${amount}. WebSocket integration is required to submit real bids.`);
  };

  if (loading) return <div className="text-white text-center py-10">Loading auction details...</div>;

  if (error || !auction) {
    return (
      <div className="text-center py-10">
        <div className="text-red-400 mb-4">{error || 'Auction not found'}</div>
        <Link to="/auctions" className="text-indigo-400 hover:text-indigo-300">
          ← Back to Auctions
        </Link>
      </div>
    );
  }

  const isSeller = user?.id === auction.sellerId;
  const isActive = auction.status === 'ACTIVE';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link to="/auctions" className="text-slate-400 hover:text-white">
          ← Back to Live Auctions
        </Link>
        <span className={`ml-auto px-3 py-1 text-sm font-bold rounded-full ${
          isActive ? 'bg-green-500 text-white animate-pulse' : 
          auction.status === 'PENDING' ? 'bg-yellow-500 text-white' : 
          'bg-slate-600 text-white'
        }`}>
          {auction.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image and Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="h-96 bg-slate-700 flex items-center justify-center">
              <span className="text-slate-500 text-xl">Image Gallery Placeholder</span>
            </div>
            <div className="p-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                {auction.itemDetails?.title || `Item #${auction.itemId}`}
              </h1>
              <div className="flex space-x-4 mb-6">
                <span className="bg-slate-700 px-3 py-1 rounded text-sm text-slate-300">
                  Condition: {auction.itemDetails?.condition || 'Unknown'}
                </span>
                <span className="bg-slate-700 px-3 py-1 rounded text-sm text-slate-300">
                  Seller ID: {auction.sellerId}
                </span>
              </div>
              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-white mb-2">Description</h3>
                <p className="text-slate-300 whitespace-pre-wrap">
                  {auction.itemDetails?.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bidding Interface */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-lg sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">Bidding</h2>
            
            <div className="bg-slate-900 rounded-xl p-6 mb-6 text-center border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Current Highest Bid</div>
              <div className="text-5xl font-bold text-indigo-400">
                ${auction.currentBid || auction.startingPrice}
              </div>
              {!auction.currentBid && (
                <div className="text-xs text-slate-500 mt-2">(Starting Price)</div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Time Remaining:</span>
                <span className="text-white font-medium">--:--:--</span> {/* Will implement real timer */}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Ends At:</span>
                <span className="text-white">
                  {new Date(auction.endTime.endsWith('Z') ? auction.endTime : auction.endTime + 'Z').toLocaleString()}
                </span>
              </div>
            </div>

            {isActive ? (
              isSeller ? (
                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-xl text-center text-sm">
                  This is your auction. You cannot place bids on your own items.
                </div>
              ) : isAuthenticated ? (
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  {bidError && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                      {bidError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Your Maximum Bid</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400">$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-lg font-semibold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-4 font-bold text-lg transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                  >
                    Place Bid
                  </button>
                </form>
              ) : (
                <div className="text-center p-4 bg-slate-900 rounded-xl border border-slate-700">
                  <p className="text-slate-300 mb-4">You must be signed in to place a bid.</p>
                  <Link 
                    to="/login"
                    className="inline-block bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-6 py-2 font-medium transition-colors"
                  >
                    Sign In to Bid
                  </Link>
                </div>
              )
            ) : (
              <div className="text-center p-4 bg-slate-900 rounded-xl border border-slate-700">
                <p className="text-slate-400 font-medium">
                  {auction.status === 'PENDING' ? 'Auction has not started yet.' : 'This auction has ended.'}
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Bid History</h3>
            <div className="text-center py-6 text-slate-500 border border-dashed border-slate-700 rounded-xl text-sm">
              Live bid stream will appear here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
