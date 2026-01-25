import React from 'react';
import { X, ExternalLink } from 'lucide-react';

const FilePreviewModal = ({ fileUrl, isOpen, onClose, title }) => {
  if (!isOpen || !fileUrl) return null;

  const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png)$/i);
  const isPDF = fileUrl.match(/\.pdf$/i);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in">
        <div className="relative w-full max-w-4xl h-[90vh] flex flex-col bg-surface border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b border-white/10 bg-black/20">
                <h3 className="font-semibold text-white truncate px-2">{title || 'File Preview'}</h3>
                <div className="flex gap-2">
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white" title="Open in New Tab">
                        <ExternalLink size={20}/>
                    </a>
                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-full text-slate-400 hover:text-red-400 transition-colors">
                        <X size={20}/>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-black/50 overflow-auto flex items-center justify-center">
                {isImage ? (
                    <img src={fileUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                ) : isPDF ? (
                    <iframe src={fileUrl} className="w-full h-full border-none" title="PDF Preview"></iframe>
                ) : (
                    <div className="text-center p-8">
                        <p className="text-slate-400 mb-4">Preview not available for this file type.</p>
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Download File</a>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default FilePreviewModal;