import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { auctionApi, CreateAuctionData } from '../../api/auctionApi';
import { itemApi, Item } from '../../api/itemApi';

const AuctionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemIdParam = searchParams.get('itemId');
  
  const [items, setItems] = useState<Item[]>([]);
  const [formData, setFormData] = useState<CreateAuctionData>({
    itemId: itemIdParam || '',
    startTime: '',
    endTime: '',
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(true);

  useEffect(() => {
    const fetchAvailableItems = async () => {
      try {
        const allItems = await itemApi.getSellerItems();
        // Allow creating auctions for AVAILABLE items OR the specific item being rescheduled
        const availableItems = allItems.filter(item => item.status === 'AVAILABLE' || item.id === itemIdParam);
        setItems(availableItems);
        
        // If itemId was in URL but we don't have it selected, set it to the first available
        if (!itemIdParam && availableItems.length > 0) {
          const firstAvailable = availableItems.find(item => item.status === 'AVAILABLE');
          if (firstAvailable) {
            setFormData(prev => ({ ...prev, itemId: firstAvailable.id }));
          }
        }
      } catch (err: any) {
        setError('Failed to load your items.');
      } finally {
        setFetchingItems(false);
      }
    };

    fetchAvailableItems();
  }, [itemIdParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: value 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemId) {
      setError('Please select an item.');
      return;
    }
    
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    
    if (end <= start) {
      setError('End time must be after start time.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload: CreateAuctionData = {
        itemId: formData.itemId,
        startTime: start.toISOString().slice(0, 19),
        endTime: end.toISOString().slice(0, 19)
      };
      
      await auctionApi.createAuction(payload);
      navigate('/seller/auctions');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create auction. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingItems) {
    return <div className="text-center text-slate-400 py-10">Loading your items...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/seller/auctions" className="text-slate-400 hover:text-white">
          ← Back to Auctions
        </Link>
        <h1 className="text-3xl font-bold text-white">Schedule New Auction</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-10 text-center">
          <p className="text-slate-400 mb-4">You don't have any available items to auction.</p>
          <Link 
            to="/seller/items/new" 
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Create an item first →
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Item to Auction</label>
              <select
                name="itemId"
                required
                value={formData.itemId}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="" disabled>-- Select an item --</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title} (Starting at ${item.startingPrice})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  required
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">End Time</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  required
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg">
              <h4 className="text-indigo-400 font-medium mb-1">Important Note</h4>
              <p className="text-sm text-slate-400">
                Once an auction starts, the item cannot be modified. The auction will automatically become active at the start time and accept live bids.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-700 flex justify-end space-x-4">
              <Link
                to="/seller/auctions"
                className="px-6 py-3 border border-slate-600 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.itemId}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule Auction'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AuctionCreatePage;
