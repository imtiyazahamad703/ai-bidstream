import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { itemApi, CreateItemData } from '../../api/itemApi';

const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const ItemCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CreateItemData>({
    title: '',
    description: '',
    startingPrice: 0,
    condition: 'NEW',
    attributes: {}
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'startingPrice' ? parseFloat(value) || 0 : value 
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB for MongoDB storage)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setFormData({ ...formData, imageData: base64 });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, imageData: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds 10MB limit`);
        return;
      }
      const ext = file.name.toLowerCase();
      if (!ext.endsWith('.pdf') && !ext.endsWith('.doc') && !ext.endsWith('.docx')) {
        setError(`File "${file.name}" is not supported. Only PDF, DOC, DOCX allowed.`);
        return;
      }
      validFiles.push(file);
    }
    
    setError(null);
    setDocuments(prev => [...prev, ...validFiles]);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return '📄';
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setUploadProgress(null);

    try {
      // Step 1: Create the item
      setUploadProgress('Creating item...');
      const createdItem = await itemApi.createItem(formData);
      
      // Step 2: Upload documents if any
      if (documents.length > 0) {
        setUploadProgress(`Uploading ${documents.length} document(s)...`);
        try {
          await itemApi.uploadItemDocuments(createdItem.id, documents);
          setUploadProgress('Documents processed successfully!');
        } catch (docErr: any) {
          console.error('Document upload failed:', docErr);
          setError(`Item created but document upload failed: ${docErr.response?.data?.error || docErr.message}. You can upload them later.`);
        }
      }
      
      navigate('/seller/items');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create item. Please check your inputs.');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/seller/items" className="text-slate-400 hover:text-white">
          ← Back to Items
        </Link>
        <h1 className="text-3xl font-bold text-white">Create New Item</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {uploadProgress && (
        <div className="bg-indigo-500/10 border border-indigo-500/50 text-indigo-400 p-4 rounded-lg text-sm flex items-center gap-3">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {uploadProgress}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Item Image</label>
            <div className="flex items-start gap-6">
              <div 
                className="w-48 h-48 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors bg-slate-900"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <svg className="mx-auto h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-xs text-slate-500">Click to upload</p>
                    <p className="text-xs text-slate-600">Max 2MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="mt-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Item Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g., Vintage Rolex Submariner"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Describe your item in detail..."
            />
          </div>

          {/* Document Upload Section */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Supporting Documents
              <span className="text-slate-500 font-normal ml-2">(Optional — PDF, DOC, DOCX)</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Upload certificates, provenance records, or any documents that describe your item. The AI Bot will use these to answer buyer questions.
            </p>
            
            <div 
              className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500/60 transition-colors bg-slate-900/50"
              onClick={() => docInputRef.current?.click()}
            >
              <svg className="mx-auto h-10 w-10 text-emerald-500/60 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-slate-400">Click to select documents</p>
              <p className="text-xs text-slate-600 mt-1">PDF, DOC, DOCX — Max 10MB each</p>
            </div>
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              onChange={handleDocumentChange}
              className="hidden"
            />

            {/* Document List */}
            {documents.length > 0 && (
              <div className="mt-4 space-y-2">
                {documents.map((doc, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{getFileIcon(doc.name)}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(doc.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="text-red-400 hover:text-red-300 transition-colors ml-3 flex-shrink-0"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <p className="text-xs text-slate-500 mt-1">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Starting Price ($)</label>
              <input
                type="number"
                name="startingPrice"
                required
                min="0"
                step="0.01"
                value={formData.startingPrice}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Condition</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="NEW">New</option>
                <option value="LIKE_NEW">Like New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700 flex justify-end space-x-4">
            <Link
              to="/seller/items"
              className="px-6 py-3 border border-slate-600 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemCreatePage;
