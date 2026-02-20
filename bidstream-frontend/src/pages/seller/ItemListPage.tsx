import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { itemApi, Item } from '../../api/itemApi';

const ItemListPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadItemIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await itemApi.getSellerItems();
        setItems(data);
      } catch (err: any) {
        setError('Failed to load items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleImageClick = (itemId: string) => {
    uploadItemIdRef.current = itemId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const itemId = uploadItemIdRef.current;
    if (!file || !itemId) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setUploadingId(itemId);
      setError(null);
      try {
        const updatedItem = await itemApi.uploadItemImage(itemId, base64);
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, imageData: updatedItem.imageData } : item
        ));
      } catch (err: any) {
        setError('Failed to upload image.');
      } finally {
        setUploadingId(null);
        // Reset file input so the same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div className="text-white text-center py-10">Loading items...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input shared across all cards */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">My Items</h1>
        <Link 
          to="/seller/items/new" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add New Item
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-10 text-center">
          <p className="text-slate-400 mb-4">You haven't added any items yet.</p>
          <Link 
            to="/seller/items/new" 
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Create your first item →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
              <div 
                className="h-48 bg-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-slate-600 transition-colors relative group"
                onClick={() => handleImageClick(item.id)}
              >
                {uploadingId === item.id ? (
                  <span className="text-indigo-400 animate-pulse">Uploading...</span>
                ) : item.imageData ? (
                  <>
                    <img src={item.imageData} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <svg className="mx-auto h-8 w-8 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-slate-500 text-xs mt-1 block group-hover:text-indigo-400 transition-colors">Click to upload</span>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white truncate">{item.title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    item.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' : 
                    item.status === 'IN_AUCTION' ? 'bg-blue-500/20 text-blue-400' : 
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-700">
                  <span className="text-indigo-400 font-bold">${item.startingPrice}</span>
                  <Link 
                    to={`/seller/items/${item.id}`}
                    className="text-sm text-slate-300 hover:text-white"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemListPage;
