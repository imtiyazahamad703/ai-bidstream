import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auctionApi, Auction } from '../../api/auctionApi';
import { itemApi, Item } from '../../api/itemApi';

const AuctionListPage: React.FC = () => {
  const [auctions, setAuctions] = useState<(Auction & { itemDetails?: Item })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const auctionsData = await auctionApi.getSellerAuctions();
        
        // Fetch item details for each auction
        const auctionsWithItems = await Promise.all(
          auctionsData.map(async (auction) => {
            try {
              const item = await itemApi.getItemDetails(auction.itemId);
              return { ...auction, itemDetails: item };
            } catch {
              return auction;
            }
          })
        );
        
        setAuctions(auctionsWithItems);
      } catch (err: any) {
        setError('Failed to load your auctions.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  if (loading) {
    return <div className="text-white text-center py-10">Loading auctions...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400';
      case 'CANCELLED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const handleDeleteAuction = async (auctionId: number) => {
    if (!window.confirm('Are you sure you want to completely delete this auction? The item will be returned to your inventory.')) {
      return;
    }
    
    try {
      await auctionApi.deleteAuction(auctionId);
      // Remove from list
      setAuctions(auctions.filter(a => a.id !== auctionId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete auction');
    }
  };

  const handleCancelAuction = async (auctionId: number) => {
    if (!window.confirm('Are you sure you want to cancel this auction? The item will be returned to your inventory.')) {
      return;
    }
    
    try {
      await auctionApi.cancelAuction(auctionId);
      setAuctions(auctions.map(a => a.id === auctionId ? { ...a, status: 'CANCELLED' } : a));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel auction');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">My Auctions</h1>
        <Link 
          to="/seller/auctions/new" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Schedule Auction
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {auctions.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-10 text-center">
          <p className="text-slate-400 mb-4">You haven't scheduled any auctions yet.</p>
          <Link 
            to="/seller/auctions/new" 
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Create your first auction →
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700">
                  <th className="p-4 text-sm font-semibold text-slate-300">Item</th>
                  <th className="p-4 text-sm font-semibold text-slate-300">Start Time</th>
                  <th className="p-4 text-sm font-semibold text-slate-300">End Time</th>
                  <th className="p-4 text-sm font-semibold text-slate-300">Current Bid</th>
                  <th className="p-4 text-sm font-semibold text-slate-300">Status</th>
                  <th className="p-4 text-sm font-semibold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {auctions.map((auction) => (
                  <tr key={auction.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">
                        {auction.itemDetails?.title || `Item #${auction.itemId}`}
                      </div>
                      <div className="text-xs text-slate-400">
                        Starting at ${auction.startingPrice}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {new Date(auction.startTime).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {new Date(auction.endTime).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm font-semibold text-indigo-400">
                      ${auction.currentBid || 0}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(auction.status)}`}>
                        {auction.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3 items-center">
                        <Link 
                          to={`/auctions/${auction.id}`}
                          className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                        >
                          View
                        </Link>
                        {['SCHEDULED', 'ACTIVE'].includes(auction.status) && (
                          <button
                            onClick={() => handleCancelAuction(auction.id)}
                            className="text-orange-400 hover:text-orange-300 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAuction(auction.id)}
                          className="text-red-500 hover:text-red-400 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionListPage;
