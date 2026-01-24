import React from 'react';
import { X, FileText, Download, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Document {
  id: number;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  summary: string;
  contentExcerpt: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents?: Document[];
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, documents = [] }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Item Documents & Provenance</h3>
                <p className="text-xs text-slate-400">Verified by BidStream Escrow Services</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No documents uploaded for this item.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-slate-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{doc.fileName}</h4>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-mono">
                          <span>{doc.fileSize}</span>
                          <span>•</span>
                          <span>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="pl-11 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Genuine</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <strong>Summary:</strong> {doc.summary}
                    </p>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto">
                      {doc.contentExcerpt}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
