import React from 'react';
import { X, ExternalLink } from 'lucide-react';

const FilePreviewModal = ({ fileUrl, isOpen, onClose, title }) => {
  if (!isOpen || !fileUrl) return null;

  const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png)$/i);
  const isPDF = fileUrl.match(/\.pdf$/i);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in">
        
        {/* Fixed Close Button */}
        <button 
            onClick={onClose} 
            className="fixed top-6 right-6 z-[110] p-3 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-500 hover:scale-110 transition-all"
            aria-label="Close Preview"
        >
            <X size={24}/>
        </button>

        <div className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-surface/50 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* Header Bar */}
            <div className="flex justify-between items-center p-3 border-b border-white/10 bg-black/40">
                <h3 className="font-semibold text-white truncate px-2">{title || 'File Preview'}</h3>
                <div className="flex gap-2">
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors" title="Open in New Tab">
                        <ExternalLink size={20}/>
                    </a>
                </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 bg-black/20 overflow-hidden ${isImage ? 'flex items-center justify-center' : ''} p-4`}>
                {isImage ? (
                    <img src={fileUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded shadow-lg" />
                ) : isPDF ? (
                    <iframe src={fileUrl} className="w-full h-full border-none rounded bg-white shadow-md" title="PDF Preview"></iframe>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center p-8 bg-surface rounded-xl border border-white/10">
                            <p className="text-slate-400 mb-4">Preview not available for this file type.</p>
                            <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                                <ExternalLink size={16}/> Download File
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default FilePreviewModal;