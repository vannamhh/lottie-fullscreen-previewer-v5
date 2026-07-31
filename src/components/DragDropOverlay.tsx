import React from 'react';
import { Upload, Sparkles } from 'lucide-react';

interface DragDropOverlayProps {
  isDragging: boolean;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-indigo-950/90 backdrop-blur-xl border-4 border-dashed border-indigo-400/80 animate-fade-in pointer-events-none text-white">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-600/30 border border-indigo-400 flex items-center justify-center shadow-2xl animate-bounce">
          <Upload className="w-10 h-10 text-indigo-200" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white">Thả Tệp Lottie Tại Đây</h2>
          <p className="text-sm text-indigo-200">
            Hỗ trợ định dạng nén <span className="font-bold text-white">.lottie</span> và <span className="font-bold text-white">.json</span> Lottie
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-900/60 rounded-full text-xs font-semibold text-indigo-300 border border-indigo-700">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Sẵn sàng xem review toàn màn hình</span>
        </div>
      </div>
    </div>
  );
};
