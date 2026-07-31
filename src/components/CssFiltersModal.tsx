import React from 'react';
import { 
  X, 
  Sliders, 
  RotateCcw, 
  Sparkles, 
  Sun, 
  Contrast, 
  Palette, 
  Eye, 
  Flame, 
  Droplet, 
  Zap, 
  Check, 
  Layers
} from 'lucide-react';
import { CssFilterSettings } from '../types';
import { 
  DEFAULT_CSS_FILTERS, 
  FILTER_PRESETS, 
  getFilterCssString 
} from '../utils/cssFilterUtils';

interface CssFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CssFilterSettings;
  onChangeFilters: (filters: CssFilterSettings) => void;
}

export const CssFiltersModal: React.FC<CssFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters
}) => {
  if (!isOpen) return null;

  const activeFilters = filters || DEFAULT_CSS_FILTERS;

  const handleUpdate = (key: keyof CssFilterSettings, value: any) => {
    onChangeFilters({
      ...activeFilters,
      [key]: value,
      preset: 'custom'
    });
  };

  const handleSelectPreset = (presetId: string) => {
    const found = FILTER_PRESETS.find(p => p.id === presetId);
    if (found) {
      onChangeFilters({ ...found.filters });
    }
  };

  const handleReset = () => {
    onChangeFilters({ ...DEFAULT_CSS_FILTERS });
  };

  const activeCssString = getFilterCssString(activeFilters);
  const isCustomOrActive = activeCssString !== 'none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Bộ Lọc Màu & Hiệu Ứng Canvas</h2>
                {isCustomOrActive && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    Đang bật
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Tùy chỉnh hiệu ứng thị giác CSS trực tiếp cho Animation Lottie trên màn hình</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCustomOrActive && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Đặt lại tất cả hiệu ứng"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt Lại</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Quick Presets Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Mẫu Bộ Lọc Cấu Hình Sẵn (Presets)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {FILTER_PRESETS.map(p => {
                const isSelected = activeFilters.preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between h-20 ${
                      isSelected 
                        ? 'bg-purple-600/20 border-purple-500/80 ring-2 ring-purple-500/30 text-white shadow-lg shadow-purple-600/20' 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.badge}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                    </div>

                    <div>
                      <p className="text-xs font-bold line-clamp-1 group-hover:text-purple-300 transition-colors">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-slate-800/80" />

          {/* Manual Slider Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Thanh Điều Chỉnh Thông Số Chi Tiết</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Brightness */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Độ Sáng (Brightness)
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{activeFilters.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={activeFilters.brightness}
                  onChange={(e) => handleUpdate('brightness', Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Contrast className="w-3.5 h-3.5 text-blue-400" />
                    Độ Tương Phản (Contrast)
                  </span>
                  <span className="font-mono text-blue-400 font-bold">{activeFilters.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={activeFilters.contrast}
                  onChange={(e) => handleUpdate('contrast', Number(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    Độ Bão Hòa Màu (Saturate)
                  </span>
                  <span className="font-mono text-rose-400 font-bold">{activeFilters.saturate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={activeFilters.saturate}
                  onChange={(e) => handleUpdate('saturate', Number(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Hue Rotate */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-emerald-400" />
                    Xoay Vòng Màu (Hue Rotate)
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{activeFilters.hueRotate}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={activeFilters.hueRotate}
                  onChange={(e) => handleUpdate('hueRotate', Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Blur */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                    Độ Mờ Nhòe (Blur)
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">{activeFilters.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={activeFilters.blur}
                  onChange={(e) => handleUpdate('blur', Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Grayscale */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    Đen Trắng (Grayscale)
                  </span>
                  <span className="font-mono text-slate-400 font-bold">{activeFilters.grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeFilters.grayscale}
                  onChange={(e) => handleUpdate('grayscale', Number(e.target.value))}
                  className="w-full accent-slate-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Sepia */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    Màu Phim Cổ (Sepia)
                  </span>
                  <span className="font-mono text-amber-600 font-bold">{activeFilters.sepia}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeFilters.sepia}
                  onChange={(e) => handleUpdate('sepia', Number(e.target.value))}
                  className="w-full accent-amber-600 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Invert */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    Đảo Màu (Invert)
                  </span>
                  <span className="font-mono text-purple-400 font-bold">{activeFilters.invert}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeFilters.invert}
                  onChange={(e) => handleUpdate('invert', Number(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

            </div>
          </div>

          {/* Glow / Drop Shadow Toggle */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Hiệu Ứng Phát Sáng / Đổ Bóng (Glow Drop Shadow)</p>
                <p className="text-[11px] text-slate-400">Tạo viền sáng huỳnh quang bao quanh đồ họa Lottie</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {activeFilters.dropShadow && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Màu phát sáng:</span>
                  <input
                    type="color"
                    value={activeFilters.shadowColor || '#6366f1'}
                    onChange={(e) => handleUpdate('shadowColor', e.target.value)}
                    className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer p-0.5"
                  />
                </div>
              )}

              <button
                onClick={() => handleUpdate('dropShadow', !activeFilters.dropShadow)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFilters.dropShadow
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {activeFilters.dropShadow ? 'Đang Bật' : 'Tắt'}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs">
            CSS Filter: <span className="text-slate-300">{activeCssString}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all"
          >
            Hoàn Tất
          </button>
        </div>

      </div>
    </div>
  );
};
