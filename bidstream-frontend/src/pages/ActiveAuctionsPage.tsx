import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auctionApi, Auction } from '../api/auctionApi';
import { itemApi, Item } from '../api/itemApi';

const ActiveAuctionsPage: React.FC = () => {
  const [auctions, setAuctions] = useState<(Auction & { itemDetails?: Item })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveAuctions = async () => {
      try {
        const auctionsData = await auctionApi.getActiveAuctions();
        
        // Fetch item details for each auction
        const auctionsWithItems = await Promise.all(
          auctionsData.map(async (auction) => {
            try {
              const item = await itemApi.getPublicItemDetails(auction.itemId);
              return { ...auction, itemDetails: item };
            } catch {
              return auction;
            }
          })
        );
        
        setAuctions(auctionsWithItems);
      } catch (err: any) {
        setError('Failed to load active auctions.');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveAuctions();
  }, []);

  if (loading) {
    return <div className="text-white text-center py-10">Loading active auctions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Live Auctions</h1>
        <div className="text-sm text-slate-400">
          Showing {auctions.length} active {auctions.length === 1 ? 'auction' : 'auctions'}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {auctions.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-10 text-center">
          <p className="text-slate-400">There are no active auctions at the moment. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <div key={auction.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col hover:border-indigo-500 transition-colors">
              <div className="h-48 bg-slate-700 flex items-center justify-center relative">
                {auction.itemDetails?.imageData ? (
                  <img src={auction.itemDetails.imageData} alt={auction.itemDetails.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-500">No Image</span>
                )}
                <div className="absolute top-2 right-2 bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                  LIVE
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white truncate mb-2">
                  {auction.itemDetails?.title || `Item #${auction.itemId}`}
                </h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-1">
                  {auction.itemDetails?.description || 'No description available.'}
                </p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Current Bid:</span>
                    <span className="text-xl font-bold text-indigo-400">
                      ${auction.currentBid || auction.startingPrice}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Ends In:</span>
                    <span className="text-white font-medium">
                      {new Date(auction.endTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <Link 
                  to={`/auctions/${auction.id}`}
                  className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 font-medium transition-colors"
                >
                  Enter Live Room
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveAuctionsPage;
