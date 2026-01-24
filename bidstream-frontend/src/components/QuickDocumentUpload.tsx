import React, { useRef, useState } from 'react';
import { itemApi } from '../api/itemApi';
import { axiosClient } from '../api/axiosClient';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface QuickDocumentUploadProps {
  itemId: string;
  auctionId: number;
}

const QuickDocumentUpload: React.FC<QuickDocumentUploadProps> = ({ itemId, auctionId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'File must be under 10MB' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'idle', message: 'Uploading document...' });

    try {
      // 1. Upload Document to Item
      await itemApi.uploadItemDocuments(itemId, [file]);
      
      setStatus({ type: 'idle', message: 'Document uploaded. Retraining AI...' });
      
      // 2. Trigger AI Embedding refresh for the auction
      await axiosClient.post(`/auctions/${auctionId}/embed`);
      
      setStatus({ type: 'success', message: 'AI successfully updated with new knowledge!' });
      
      // Clear status after 5 seconds
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
      
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to update AI knowledge.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="mb-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Update AI Knowledge
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          If the AI cannot answer a bidder's question, upload a new document (PDF/Doc) here. The AI will instantly read it and learn the answer.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileUpload}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950 flex flex-col items-center justify-center gap-2 transition-colors group disabled:opacity-50 disabled:hover:border-slate-700"
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
        ) : (
          <Upload className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        )}
        <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-300">
          {isUploading ? 'Processing Document...' : 'Upload New Document'}
        </span>
      </button>

      {status.type !== 'idle' && (
        <div className={`mt-3 p-3 text-xs rounded-xl flex items-center gap-2 ${
          status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {status.message}
        </div>
      )}
    </div>
  );
};

export default QuickDocumentUpload;
