import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { itemApi, CreateItemData } from '../../api/itemApi';
import { Upload, X, FileText, Image as ImageIcon, ChevronLeft, Loader2, Info } from 'lucide-react';
import { motion } from 'motion/react';

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

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setFormData({ ...formData, imageData: base64 });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, imageData: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      setUploadProgress('Creating item...');
      const createdItem = await itemApi.createItem(formData);
      
      if (documents.length > 0) {
        setUploadProgress(`Uploading ${documents.length} document(s)...`);
        try {
          await itemApi.uploadItemDocuments(createdItem.id, documents);
          setUploadProgress('Documents processed successfully!');
        } catch (docErr: any) {
          console.error('Document upload failed:', docErr);
          setError(`Item created but document upload failed: ${docErr.response?.data?.error || docErr.message}.`);
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
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
        <Link to="/seller/items" className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Register New Lot</h1>
          <p className="text-sm text-slate-400 mt-1">Add items to your inventory to be scheduled for live rings.</p>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm flex items-start gap-3">
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </motion.div>
      )}

      {uploadProgress && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{uploadProgress}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Main Details Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-800/60 pb-2">Lot Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Image Upload Area */}
            <div className="md:col-span-4 space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Primary Hero Image</label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative group aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all ${
                  imagePreview 
                    ? 'border-indigo-500/50 hover:border-indigo-500' 
                    : 'border-slate-700 bg-slate-950 hover:border-indigo-500 hover:bg-slate-900/50'
                }`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-lg">Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-300 group-hover:text-indigo-300 transition-colors">Upload Image</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">JPEG/PNG max 2MB</p>
                    </div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              
              {imagePreview && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="w-full py-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors"
                >
                  Remove Image
                </button>
              )}
            </div>

            {/* Title & Desc Area */}
            <div className="md:col-span-8 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Title / Name</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="e.g. 1969 Omega Speedmaster Apollo 11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Description</label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors custom-scrollbar"
                  placeholder="Provide detailed information about the item..."
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Starting Reserve ($)</label>
                  <input
                    type="number"
                    name="startingPrice"
                    required
                    min="0"
                    step="0.01"
                    value={formData.startingPrice}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Condition</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                  >
                    <option value="NEW">New / Unworn</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="GOOD">Good / Vintage</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Requires Restoration</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* AI Documents Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between border-b border-slate-800/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">AI Provenance & Certificates</h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Upload authenticity certificates, service records, or appraisals. Our Gemini RAG Assistant will parse these to answer live bidder questions automatically.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center gap-1.5 shrink-0">
              <Info className="w-3.5 h-3.5" />
              Optional
            </div>
          </div>
          
          <div 
            onClick={() => docInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 bg-slate-950 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors group"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-300 group-hover:text-indigo-300 transition-colors">Click to upload provenance documents</p>
            <p className="text-xs text-slate-500 font-mono mt-1.5">PDF, DOC, DOCX — Max 10MB per file</p>
          </div>
          <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx" multiple onChange={handleDocumentChange} className="hidden" />

          {documents.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Documents ({documents.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-lg bg-slate-900 text-slate-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate pr-4">{doc.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{formatFileSize(doc.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeDocument(index); }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-2">
          <Link
            to="/seller/items"
            className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-sm transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Register Lot to Inventory</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ItemCreatePage;
