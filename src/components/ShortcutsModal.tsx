import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Phát / Tạm dừng (Play / Pause)' },
    { key: 'F', desc: 'Toàn màn hình trình duyệt (Toggle Fullscreen)' },
    { key: 'R', desc: 'Phát lại từ đầu (Restart)' },
    { key: 'H', desc: 'Ẩn / Hiện thanh công cụ (Toggle UI)' },
    { key: '+ / -', desc: 'Thu phóng Canvas (Zoom In / Zoom Out)' },
    { key: '0', desc: 'Đặt lại 100% và căn giữa (Reset Zoom & Pan)' },
    { key: 'Kéo Chuột (Drag)', desc: 'Di chuyển vị trí Canvas (Pan X/Y)' },
    { key: 'Con Lăn (Wheel)', desc: 'Thu phóng tâm theo con lăn chuột' },
    { key: 'Alt + Mũi Tên', desc: 'Di chuyển Canvas bằng phím mũi tên' },
    { key: '← / →', desc: 'Lùi / Tới 1 Frame (Step 1 Frame)' },
    { key: 'Shift + ← / →', desc: 'Tua lùi / tới 10 Frames' },
    { key: 'L', desc: 'Bật / Tắt chế độ Lặp (Loop)' },
    { key: 'M', desc: 'Bật / Tắt âm thanh (Mute/Unmute)' },
    { key: '[ / ]', desc: 'Giảm / Tăng tốc độ phát' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Phím Tắt Bàn Phím</h2>
              <p className="text-xs text-slate-400">Điều khiển xem review mượt mà và chuyên nghiệp</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs"
            >
              <span className="text-slate-300 font-medium">{sc.desc}</span>
              <kbd className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-indigo-300 font-mono font-bold shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
