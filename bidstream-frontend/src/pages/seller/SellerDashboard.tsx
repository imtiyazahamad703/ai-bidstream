import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { itemApi } from '../../api/itemApi';
import { auctionApi } from '../../api/auctionApi';

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <Link 
          to="/seller/items/new" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add New Item
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Total Items</h3>
          <p className="text-3xl font-bold text-white">{loading ? '...' : stats.items}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Active/Scheduled Auctions</h3>
          <p className="text-3xl font-bold text-white">{loading ? '...' : stats.activeAuctions}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Completed Auctions</h3>
          <p className="text-3xl font-bold text-white">{loading ? '...' : stats.completedAuctions}</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="text-slate-400 text-sm py-8 text-center border-2 border-dashed border-slate-700 rounded-lg">
          Activity feed coming soon!
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
