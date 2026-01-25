import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auctionApi, Auction } from '../../api/auctionApi';
import { itemApi, Item } from '../../api/itemApi';
import { Calendar, Trash2, Ban, Eye, Plus, ChevronRight, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AuctionListPage: React.FC = () => {
  const [auctions, setAuctions] = useState<(Auction & { itemDetails?: Item })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const auctionsData = await auctionApi.getSellerAuctions();
        
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
        setError('Failed to load your scheduled rings.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>Live</span>;
      case 'PENDING': 
      case 'SCHEDULED': return <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit"><Clock className="w-3 h-3"/>Scheduled</span>;
      case 'COMPLETED': return <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase tracking-wider w-fit">Completed</span>;
      case 'CANCELLED': return <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider w-fit">Cancelled</span>;
      default: return <span className="px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[10px] font-bold uppercase tracking-wider w-fit">{status}</span>;
    }
  };

  const handleDeleteAuction = async (auctionId: number) => {
    if (!window.confirm('Are you sure you want to completely delete this auction? The item will be returned to your inventory.')) return;
    try {
      await auctionApi.deleteAuction(auctionId);
      setAuctions(auctions.filter(a => a.id !== auctionId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete auction');
    }
  };

  const handleCancelAuction = async (auctionId: number) => {
    if (!window.confirm('Are you sure you want to cancel this auction? The item will be returned to your inventory.')) return;
    try {
      await auctionApi.cancelAuction(auctionId);
      setAuctions(auctions.map(a => a.id === auctionId ? { ...a, status: 'CANCELLED' } : a));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel auction');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-indigo-400 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="font-mono text-sm font-bold tracking-widest">LOADING RINGS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Scheduled Rings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your active and upcoming live auctions.</p>
        </div>
        <Link 
          to="/seller/auctions/new" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Ring</span>
        </Link>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {auctions.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <h3 className="text-base font-bold text-slate-300">No Rings Scheduled</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            You don't have any items scheduled for live auction yet. Schedule an item from your inventory to begin.
          </p>
          <Link 
            to="/seller/auctions/new" 
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
          >
            Schedule a Ring <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {auctions.map((auction) => {
              const item = auction.itemDetails;
              const isLive = auction.status === 'ACTIVE';
              
              return (
                <motion.div
                  key={auction.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:border-indigo-500/50 transition-colors"
                >
                  {/* Card Image Area */}
                  <div className="h-60 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                    {item?.imageData ? (
                      <img src={item.imageData} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="text-slate-700 font-mono text-xs uppercase tracking-widest">No Image</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(auction.status)}
                    </div>
                  </div>

                  {/* Card Content Area */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-1 truncate">{item?.title || `Item #${auction.itemId}`}</h3>
                    <p className="text-xs text-slate-400 font-mono mb-4 border-b border-slate-800 pb-4">
                      Lot ID: {auction.itemId.substring(0,8)}...
                    </p>

                    <div className="space-y-3 mb-6 flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 uppercase tracking-wider font-bold">Start Time</span>
                        <span className="text-slate-300 font-medium">
                          {new Date(auction.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 uppercase tracking-wider font-bold">Base Reserve</span>
                        <span className="text-slate-300 font-medium font-mono">${auction.startingPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                        <span className="text-indigo-400/80 uppercase tracking-wider font-bold">Current Bid</span>
                        <span className="text-indigo-400 font-bold font-mono text-sm">${(auction.currentBid || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <Link 
                        to={`/auctions/${auction.id}`}
                        className={`col-span-2 sm:col-span-1 py-2 rounded-lg flex justify-center items-center gap-1.5 text-xs font-bold transition-colors ${
                          isLive 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isLive ? 'Enter Ring' : 'Preview'}
                      </Link>

                      {['SCHEDULED', 'PENDING', 'ACTIVE'].includes(auction.status) && (
                        <button
                          onClick={() => handleCancelAuction(auction.id)}
                          className="py-2 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/50 flex justify-center items-center gap-1.5 text-xs font-bold transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      )}
                      
                      {['COMPLETED', 'CANCELLED'].includes(auction.status) && (
                        <Link
                          to={`/seller/auctions/new?itemId=${auction.itemId}`}
                          className="py-2 rounded-lg bg-slate-800 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-slate-700 hover:border-blue-500/50 flex justify-center items-center gap-1.5 text-xs font-bold transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reschedule
                        </Link>
                      )}

                      <button
                        onClick={() => handleDeleteAuction(auction.id)}
                        className={`py-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 flex justify-center items-center gap-1.5 text-xs font-bold transition-colors ${['SCHEDULED', 'PENDING', 'ACTIVE'].includes(auction.status) ? '' : 'col-span-2 sm:col-span-2'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AuctionListPage;
