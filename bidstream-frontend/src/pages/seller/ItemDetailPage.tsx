import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemApi, Item } from '../../api/itemApi';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        if (!id) return;
        const data = await itemApi.getItemDetails(id);
        setItem(data);
      } catch (err: any) {
        setError('Failed to load item details.');
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this item?')) return;
    
    setIsDeleting(true);
    try {
      await itemApi.deleteItem(id);
      navigate('/seller/items');
    } catch (err: any) {
      setError('Failed to delete item.');
      setIsDeleting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

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
      setIsUploading(true);
      setError(null);
      try {
        const updatedItem = await itemApi.uploadItemImage(id, base64);
        setItem(prev => prev ? { ...prev, imageData: updatedItem.imageData } : prev);
      } catch (err: any) {
        setError('Failed to upload image.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="text-white text-center py-10">Loading item details...</div>;

  if (error && !item) {
    return (
      <div className="text-center py-10">
        <div className="text-red-400 mb-4">{error || 'Item not found'}</div>
        <Link to="/seller/items" className="text-indigo-400 hover:text-indigo-300">
          ← Back to Items
        </Link>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="flex items-center space-x-4 mb-6">
        <Link to="/seller/items" className="text-slate-400 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-white flex-1">{item.title}</h1>
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
          item.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' : 
          item.status === 'IN_AUCTION' ? 'bg-blue-500/20 text-blue-400' : 
          'bg-slate-500/20 text-slate-400'
        }`}>
          {item.status}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Item Image - clickable to upload/change */}
          <div 
            className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-md cursor-pointer group relative"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="h-64 flex items-center justify-center">
                <span className="text-indigo-400 animate-pulse text-lg">Uploading image...</span>
              </div>
            ) : item.imageData ? (
              <>
                <img src={item.imageData} alt={item.title} className="w-full max-h-96 object-contain bg-slate-900" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium">Click to change image</span>
                </div>
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-slate-900 group-hover:bg-slate-800 transition-colors">
                <svg className="h-16 w-16 text-slate-600 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-3 text-slate-500 group-hover:text-indigo-400 transition-colors font-medium">Click to upload image</p>
                <p className="text-xs text-slate-600 mt-1">JPG, PNG up to 2MB</p>
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-md">
            <h2 className="text-xl font-bold text-white mb-4">Description</h2>
            <p className="text-slate-300 whitespace-pre-wrap">{item.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-md">
            <h2 className="text-xl font-bold text-white mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-sm text-slate-400">Starting Price</span>
                <span className="text-2xl font-bold text-indigo-400">${item.startingPrice}</span>
              </div>
              <div>
                <span className="block text-sm text-slate-400">Condition</span>
                <span className="text-lg text-white">{item.attributes?.condition || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-sm text-slate-400">Listed On</span>
                <span className="text-white">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-md space-y-3">
            <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
            {item.status === 'AVAILABLE' && (
              <>
                <Link
                  to={`/seller/auctions/new?itemId=${item.id}`}
                  className="w-full block text-center bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2 font-medium transition-colors"
                >
                  Create Auction
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/50 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Item'}
                </button>
              </>
            )}
            {item.status !== 'AVAILABLE' && (
              <div className="text-sm text-slate-400 text-center">
                This item is currently {item.status.replace('_', ' ').toLowerCase()} and cannot be modified.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
