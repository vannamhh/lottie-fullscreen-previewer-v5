import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Palette, 
  Image as ImageIcon, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Download,
  Info,
  FileText,
  Activity
} from 'lucide-react';
import { LottieMetadata } from '../types';

interface InspectorDrawerProps {
  metadata: LottieMetadata | null;
  isOpen: boolean;
  onClose: () => void;
}

const InspectorDrawerComponent: React.FC<InspectorDrawerProps> = ({
  metadata,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'colors' | 'layers' | 'assets'>('overview');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyColor = (colorHex: string) => {
    navigator.clipboard.writeText(colorHex);
    setCopiedColor(colorHex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  // Compute performance assessment
  const getHealthBadge = () => {
    if (!metadata) return null;

    const isLightSize = metadata.fileSizeBytes < 300 * 1024; // < 300KB
    const isModerateLayers = metadata.layerCount <= 50;

    if (isLightSize && isModerateLayers) {
      return {
        label: 'Tối Ưu Hoàn Hảo (Optimal)',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: CheckCircle2,
        desc: 'Tệp có kích thước nhẹ, cấu trúc layer tối ưu, tải nhanh trên thiết bị di động.'
      };
    } else if (metadata.fileSizeBytes < 1000 * 1024) {
      return {
        label: 'Khá Tốt (Good)',
        color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        icon: CheckCircle2,
        desc: 'Tệp hoạt động mượt mà trên đa số ứng dụng Web & Mobile.'
      };
    } else {
      return {
        label: 'Kích Thước Lớn (Heavy)',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: AlertCircle,
        desc: 'Dung lượng khá lớn. Hãy nén bớt hình ảnh đính kèm hoặc giảm bớt vector keyframe.'
      };
    }
  };

  const health = getHealthBadge();

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl flex flex-col text-slate-200 transition-all duration-300">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Bảng Phân Tích Lottie</h2>
            <p className="text-[11px] text-slate-400">Kiểm tra thông số kỹ thuật, layer & màu sắc</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/50 p-1 gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Tổng Quan</span>
        </button>

        <button
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'colors'
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          <span>Bảng Màu ({metadata?.colors.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'layers'
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Layer ({metadata?.layerCount || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'assets'
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Asset ({metadata?.extractedAssets.length || 0})</span>
        </button>
      </div>

      {/* Drawer Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {!metadata ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Chưa có thông tin tệp Lottie. Hãy mở một tệp để bắt đầu phân tích.
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                
                {/* Health Rating Card */}
                {health && (
                  <div className={`p-3.5 rounded-2xl border ${health.color} space-y-1`}>
                    <div className="flex items-center gap-2">
                      <health.icon className="w-4 h-4" />
                      <span className="text-xs font-bold">{health.label}</span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">{health.desc}</p>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Định Dạng</span>
                    <p className="text-sm font-semibold text-white mt-0.5 uppercase">.{metadata.format}</p>
                  </div>

                  <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Dung Lượng</span>
                    <p className="text-sm font-semibold text-white mt-0.5">{metadata.fileSizeFormatted}</p>
                  </div>

                  <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Kích Thước</span>
                    <p className="text-sm font-semibold text-white mt-0.5 font-mono">{metadata.width} × {metadata.height} px</p>
                  </div>

                  <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Tốc Độ Khung Hình</span>
                    <p className="text-sm font-semibold text-white mt-0.5 font-mono">{metadata.fps} FPS</p>
                  </div>

                  <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Tổng Số Khung</span>
                    <p className="text-sm font-semibold text-white mt-0.5 font-mono">{metadata.totalFrames} frames</p>
                  </div>

                  <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Thời Lượng</span>
                    <p className="text-sm font-semibold text-white mt-0.5 font-mono">{metadata.durationSeconds} giây</p>
                  </div>
                </div>

                {/* Detailed Meta */}
                <div className="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Tên Tệp</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[200px]">{metadata.fileName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Công Cụ Tạo</span>
                    <span className="font-semibold text-slate-200">{metadata.generator || 'Lottie / Bodymovin'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Số Lượng Layer</span>
                    <span className="font-semibold text-slate-200">{metadata.layerCount} layers</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Tệp Hình Ảnh Đính Kèm</span>
                    <span className="font-semibold text-slate-200">{metadata.assetCount} assets</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: COLOR PALETTE */}
            {activeTab === 'colors' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Danh sách mã màu được sử dụng trong các hình khối vector và lớp fill/stroke:
                </p>

                {metadata.colors.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Không tìm thấy mã màu trực tiếp trong tệp.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {metadata.colors.map((hexColor, i) => (
                      <div
                        key={i}
                        onClick={() => handleCopyColor(hexColor)}
                        className="flex items-center justify-between p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-6 h-6 rounded-lg border border-slate-600 shadow-sm shrink-0" 
                            style={{ backgroundColor: hexColor }} 
                          />
                          <span className="text-xs font-mono font-semibold text-slate-200">{hexColor}</span>
                        </div>
                        <button className="text-slate-400 group-hover:text-white p-1">
                          {copiedColor === hexColor ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LAYERS */}
            {activeTab === 'layers' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 mb-2">Cấu trúc các lớp (Layers) trong animation:</p>
                {metadata.layers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Không tìm thấy cấu trúc layer chi tiết.</p>
                ) : (
                  metadata.layers.map((layer, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono text-slate-500 w-5">#{idx + 1}</span>
                        <span className="font-medium text-slate-200 truncate">{layer.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded text-[10px] font-semibold shrink-0">
                        {layer.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: ASSETS */}
            {activeTab === 'assets' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Các hình ảnh hoặc asset phương tiện được đính kèm trong tệp:</p>
                
                {metadata.extractedAssets.length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/30 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-semibold">Tệp Vector Đơn Thuần</p>
                    <p className="text-[11px] text-slate-500 mt-1">Không sử dụng tệp ảnh bitmap ngoài, vô cùng nhẹ và sắc nét!</p>
                  </div>
                ) : (
                  metadata.extractedAssets.map((asset, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {asset.dataUrl ? (
                          <img 
                            src={asset.dataUrl} 
                            alt={asset.fileName} 
                            className="w-10 h-10 object-contain rounded bg-slate-950 p-1 border border-slate-700 shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-950 flex items-center justify-center text-slate-600 shrink-0">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{asset.fileName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {asset.width && asset.height ? `${asset.width}×${asset.height} px` : ''} {asset.sizeFormatted}
                          </p>
                        </div>
                      </div>

                      {asset.dataUrl && (
                        <a
                          href={asset.dataUrl}
                          download={asset.fileName || `asset_${idx}.png`}
                          className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg transition-all shrink-0"
                          title="Tải asset này"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export const InspectorDrawer = React.memo(InspectorDrawerComponent);
