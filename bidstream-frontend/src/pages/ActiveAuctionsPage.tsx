import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { auctionApi } from '../api/auctionApi';
import { itemApi } from '../api/itemApi';
import { Auction } from '../types/auction';
import { Gavel, Search } from 'lucide-react';

const ActiveAuctionsPage: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Luxury Watches', 'Automotive Classics', 'Fine Art', 'Trading Cards & Pop Culture', 'Rare Wines & Spirits'];

  useEffect(() => {
    const fetchActiveAuctions = async () => {
      try {
        const auctionsData = await auctionApi.getActiveAuctions();
        
        // Fetch item details for each auction
        const auctionsWithItems = await Promise.all(
          auctionsData.map(async (auction) => {
            try {
              const item = await itemApi.getPublicItemDetails(auction.itemId);
              // Map itemDetails to item for UI compatibility
              return { ...auction, item: item } as unknown as Auction;
            } catch (error) {
              console.error(`Failed to fetch item details for auction ${auction.id} with itemId ${auction.itemId}`, error);
              return auction as unknown as Auction;
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

  const filteredAuctions = useMemo(() => {
    return auctions.filter(auction => {
      const category = auction.item?.category || 'Luxury Watches'; // default for un-categorized
      const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (auction.item?.title || '').toLowerCase().includes(q) ||
        (auction.item?.description || '').toLowerCase().includes(q) ||
        category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [auctions, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="font-mono text-sm">Loading Live Rings...</p>
      </div>
    );
  }

  return (
    <section id="featured-auctions-grid" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Live Auctions
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredAuctions.length} active {filteredAuctions.length === 1 ? 'auction' : 'auctions'}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}


      {/* Auction Cards Grid */}
      {filteredAuctions.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <Gavel className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <h3 className="text-sm font-bold text-slate-300">No active auctions found</h3>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAuctions.map((auction) => {
            const item = auction.item;
            const heroImage = item?.imageData || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80';
            const currentBid = auction.currentBid || auction.startingPrice || 0;

            return (
              <div
                key={auction.id}
                className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  {/* Image Container with Top-Right LIVE Badge */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <img
                      src={heroImage}
                      alt={item?.title || 'Item'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Live Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded bg-rose-600/90 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    </div>

                    {/* Category overlay bottom left */}
                    <div className="absolute bottom-2 left-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-amber-300 font-mono text-[10px] border border-slate-700">
                        {item?.category || 'Luxury Watches'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {item?.title || `Item #${auction.itemId}`}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {item?.description || 'No description available.'}
                    </p>

                    {/* Price & Ends In Info */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[11px] uppercase text-slate-500 block">Current Bid:</span>
                        <span className="text-base font-bold text-indigo-400">
                          ${currentBid.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] uppercase text-slate-500 block">Ends In:</span>
                        <span className="text-sm text-slate-300 font-medium">
                          {new Date(auction.endTime.endsWith('Z') ? auction.endTime : auction.endTime + 'Z').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enter Live Room CTA */}
                <div className="p-6 pt-0">
                  <Link
                    to={`/auctions/${auction.id}`}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Enter Live Room</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ActiveAuctionsPage;
