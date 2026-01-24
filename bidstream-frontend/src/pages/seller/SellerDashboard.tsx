import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { itemApi } from '../../api/itemApi';
import { auctionApi } from '../../api/auctionApi';
import { Package, Radio, CheckCircle, TrendingUp, Plus } from 'lucide-react';
import { motion } from 'motion/react';

const SellerDashboard: React.FC = () => {
  const [stats, setStats] = useState({ items: 0, activeAuctions: 0, completedAuctions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [items, auctions] = await Promise.all([
          itemApi.getSellerItems(),
          auctionApi.getSellerAuctions()
        ]);
        
        setStats({
          items: items.length,
          activeAuctions: auctions.filter(a => a.status === 'ACTIVE' || a.status === 'SCHEDULED').length,
          completedAuctions: auctions.filter(a => a.status === 'COMPLETED').length
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Seller Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your inventory and live auction rings</p>
        </div>
        <Link 
          to="/seller/items/new" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lot</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-5 relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Lots Inventory</h3>
            <p className="text-3xl font-extrabold text-white font-mono">{loading ? '...' : stats.items}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-5 relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"></div>
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 relative">
            <Radio className="w-7 h-7" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Live Rings</h3>
            <p className="text-3xl font-extrabold text-white font-mono">{loading ? '...' : stats.activeAuctions}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-5 relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Completed Auctions</h3>
            <p className="text-3xl font-extrabold text-white font-mono">{loading ? '...' : stats.completedAuctions}</p>
          </div>
        </motion.div>
        
      </div>

      {/* Activity Feed Placeholder */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-8"
      >
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800/60">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Recent Activity Stream</h2>
        </div>
        <div className="text-slate-500 text-sm py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center">
          <TrendingUp className="w-8 h-8 opacity-20 mb-3" />
          <p>Real-time analytics and activity feed coming soon.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default SellerDashboard;
