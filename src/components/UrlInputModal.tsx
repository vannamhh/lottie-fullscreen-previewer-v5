import React, { useState } from 'react';
import { X, Link as LinkIcon, Download, Sparkles } from 'lucide-react';

interface UrlInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadUrl: (url: string) => void;
}

export const UrlInputModal: React.FC<UrlInputModalProps> = ({ isOpen, onClose, onLoadUrl }) => {
  const [inputUrl, setInputUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onLoadUrl(inputUrl.trim());
      onClose();
    }
  };

  const sampleUrls = [
    { label: 'Checkmark Celebration', url: 'https://assets2.lottiefiles.com/packages/lf20_pqn4625x.json' },
    { label: 'Space Rocket', url: 'https://assets5.lottiefiles.com/packages/lf20_1pxqjd43.json' },
    { label: 'Cyber Spinner', url: 'https://assets9.lottiefiles.com/packages/lf20_b88nh30c.json' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tải Lottie Từ URL</h2>
              <p className="text-xs text-slate-400">Dán liên kết tệp .lottie hoặc .json từ LottieFiles hoặc CDN</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Đường Dẫn URL</label>
            <input
              type="url"
              required
              placeholder="https://assets.lottiefiles.com/packages/example.json"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Gợi ý URL mẫu:</span>
            <div className="space-y-1">
              {sampleUrls.map((s, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setInputUrl(s.url)}
                  className="w-full text-left p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-xs flex items-center justify-between transition-all"
                >
                  <span className="font-medium text-slate-200">{s.label}</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            Tải Animation Này
          </button>
        </form>

      </div>
    </div>
  );
};
