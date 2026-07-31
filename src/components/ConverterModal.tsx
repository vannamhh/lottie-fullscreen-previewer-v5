import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  RefreshCw, 
  Download, 
  FileJson, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Upload, 
  Zap,
  Info,
  Sliders,
  Gauge,
  CheckSquare,
  Square,
  Eye
} from 'lucide-react';
import { LottieMetadata } from '../types';
import { convertJsonToDotLottie, downloadFile, ConvertOptions } from '../utils/lottieConverter';
import { optimizeLottieJson, LottieOptimizeOptions, OptimizationResult } from '../utils/lottieOptimizer';
import { formatBytes, getUrlFileName, isJsonUrl } from '../utils/lottieParser';

interface ConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: LottieMetadata | null;
  jsonData: any | null;
  fileSourceUrl: string | null;
  onPreviewConverted?: (payload: { blob?: Blob; json?: any; name: string; format: 'dotlottie' | 'json' }) => void;
}

export const ConverterModal: React.FC<ConverterModalProps> = ({
  isOpen,
  onClose,
  metadata,
  jsonData,
  fileSourceUrl,
  onPreviewConverted
}) => {
  const [activeMode, setActiveMode] = useState<'jsonToLottie' | 'optimizeJson'>('jsonToLottie');
  const [currentJson, setCurrentJson] = useState<any | null>(jsonData);
  const [fileName, setFileName] = useState<string>(metadata?.fileName || 'animation.json');
  
  // Custom DotLottie Settings
  const [author, setAuthor] = useState('Lottie Creator');
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [animationId, setAnimationId] = useState('animation');

  // Optimizer Settings (Allow custom toggle on/off)
  const [enableOptimizer, setEnableOptimizer] = useState(true);
  const [roundPrecision, setRoundPrecision] = useState(2);
  const [stripNames, setStripNames] = useState(true);
  const [stripHidden, setStripHidden] = useState(true);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [minify, setMinify] = useState(true);

  // Result state
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; size: number; compressedPercent: number; rawJsonSize: number } | null>(null);

  // Follow whatever the app currently has open. The modal stays mounted while
  // closed, so anything derived from the old file has to be dropped here —
  // otherwise the download button keeps handing out the previous archive.
  useEffect(() => {
    setResult(null);

    if (metadata?.fileName) {
      setFileName(metadata.fileName);
    } else if (fileSourceUrl) {
      setFileName(getUrlFileName(fileSourceUrl, 'animation.json'));
    }

    if (jsonData) {
      setCurrentJson(jsonData);
      return;
    }

    if (fileSourceUrl && isJsonUrl(fileSourceUrl)) {
      let cancelled = false;
      fetch(fileSourceUrl)
        .then(res => res.json())
        .then(data => { if (!cancelled) setCurrentJson(data); })
        .catch(() => { if (!cancelled) setCurrentJson(null); });
      return () => { cancelled = true; };
    }

    // A .lottie archive cannot be optimized here; better empty than showing the
    // previous file's JSON under the new file's name.
    setCurrentJson(null);
  }, [jsonData, fileSourceUrl, metadata]);

  // Live calculation of JSON optimization metrics
  const liveOptimization: OptimizationResult | null = useMemo(() => {
    if (!currentJson) return null;
    if (!enableOptimizer) {
      const jsonStr = minify ? JSON.stringify(currentJson) : JSON.stringify(currentJson, null, 2);
      const size = new Blob([jsonStr]).size;
      return {
        optimizedJson: currentJson,
        jsonString: jsonStr,
        originalSize: size,
        optimizedSize: size,
        savedBytes: 0,
        savedPercent: 0
      };
    }
    return optimizeLottieJson(currentJson, {
      roundPrecision,
      stripNames,
      stripHidden,
      stripMetadata,
      minify
    });
  }, [currentJson, enableOptimizer, roundPrecision, stripNames, stripHidden, stripMetadata, minify]);

  if (!isOpen) return null;

  // Handle uploaded JSON file for conversion
  const handleUploadJson = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setCurrentJson(json);
        setResult(null);
      } catch (err) {
        alert('Tệp JSON không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  // Convert JSON -> .lottie
  const handleConvert = async () => {
    if (!currentJson) {
      alert('Vui lòng chọn hoặc tải lên một tệp Lottie JSON.');
      return;
    }

    setIsConverting(true);
    try {
      const options: ConvertOptions = {
        author,
        speed,
        loop,
        autoplay: true,
        animationId: animationId.trim() || 'animation',
        optimize: enableOptimizer,
        optimizeOptions: {
          roundPrecision,
          stripNames,
          stripHidden,
          stripMetadata,
          minify
        }
      };

      const res = await convertJsonToDotLottie(currentJson, options);
      setResult(res);
    } catch (err) {
      alert('Lỗi khi chuyển đổi sang .lottie: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsConverting(false);
    }
  };

  // Download converted .lottie file
  const handleDownloadDotLottie = () => {
    if (!result) return;
    const cleanName = fileName.replace(/\.json$/i, '') + '.lottie';
    downloadFile(result.blob, cleanName);
  };

  const handlePreviewDotLottie = () => {
    if (!result) return;
    const cleanName = fileName.replace(/\.json$/i, '') + '.lottie';
    onPreviewConverted?.({
      blob: result.blob,
      name: cleanName,
      format: 'dotlottie'
    });
  };

  // Download extracted / optimized JSON file
  const handleDownloadOptimizedJson = () => {
    if (!liveOptimization) return;
    const blob = new Blob([liveOptimization.jsonString], { type: 'application/json' });
    const prefix = enableOptimizer ? 'optimized_' : '';
    const cleanName = fileName.endsWith('.json') ? `${prefix}${fileName}` : `${prefix}${fileName}.json`;
    downloadFile(blob, cleanName);
  };

  const handlePreviewOptimizedJson = () => {
    if (!liveOptimization) return;
    const prefix = enableOptimizer ? 'optimized_' : '';
    const cleanName = fileName.endsWith('.json') ? `${prefix}${fileName}` : `${prefix}${fileName}.json`;
    onPreviewConverted?.({
      json: liveOptimization.optimizedJson,
      name: cleanName,
      format: 'json'
    });
  };

  const jsonSizeBytes = liveOptimization ? liveOptimization.originalSize : (currentJson ? new Blob([JSON.stringify(currentJson)]).size : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Chuyển Đổi & Tối Ưu Lottie JSON</h2>
              <p className="text-xs text-slate-400">Rút gọn tọa độ, lọc dữ liệu thừa & nén sang *.lottie nhẹ hơn đến 80%</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          <button
            onClick={() => setActiveMode('jsonToLottie')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeMode === 'jsonToLottie'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Đóng Gói Sang .lottie (Zip)</span>
          </button>

          <button
            onClick={() => setActiveMode('optimizeJson')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeMode === 'optimizeJson'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Tối Ưu / Rút Gọn JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Input File Summary */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Tệp JSON Đầu Vào:</span>
              <label className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Tải tệp JSON khác</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    // Clear the value so re-picking the same file still fires 'change'
                    e.target.value = '';
                    if (file) handleUploadJson(file);
                  }}
                />
              </label>
            </div>

            {currentJson ? (
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-xs">{fileName}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Dung lượng gốc: <span className="text-amber-300 font-bold">{formatBytes(jsonSizeBytes)}</span>
                    </p>
                  </div>
                </div>

                {liveOptimization && enableOptimizer && liveOptimization.savedPercent > 0 && (
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Giảm {liveOptimization.savedPercent}% JSON
                  </span>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                Chưa có dữ liệu JSON. Mở một tệp Lottie JSON hoặc tải tệp lên từ máy tính.
              </div>
            )}
          </div>

          {/* Lottie Optimizer Settings Box (Tối Ưu / Rút Gọn JSON Tùy Chọn) */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Tối Ưu Dung Lượng Lottie JSON (Optimizer)</span>
              </div>

              {/* Master Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableOptimizer}
                  onChange={(e) => {
                    setEnableOptimizer(e.target.checked);
                    setResult(null);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-300">
                  {enableOptimizer ? 'Đã Bật' : 'Tắt'}
                </span>
              </label>
            </div>

            {enableOptimizer ? (
              <div className="space-y-3 pt-1 text-xs">
                {/* Rounding Precision */}
                <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="font-medium text-slate-200 block">Làm tròn số thập phân tọa độ</span>
                    <span className="text-[10px] text-slate-400">Giảm độ dài số thực của tọa độ. Màu sắc và đường cong easing luôn giữ tối thiểu 3 chữ số.</span>
                  </div>
                  <select
                    value={roundPrecision}
                    onChange={(e) => {
                      setRoundPrecision(Number(e.target.value));
                      setResult(null);
                    }}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:border-indigo-500"
                  >
                    <option value={0}>0 Chữ số (Nguyên)</option>
                    <option value={1}>1 Chữ số (Ví dụ 12.3)</option>
                    <option value={2}>2 Chữ số (Mặc định 12.34)</option>
                    <option value={3}>3 Chữ số (12.345)</option>
                  </select>
                </div>

                {/* Checklist Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setStripNames(!stripNames); setResult(null); }}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-900/60 hover:bg-slate-900 rounded-xl border border-slate-800 text-left transition-all"
                  >
                    {stripNames ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-200 block">Lọc tên Layer / Shape ('nm')</span>
                      <span className="text-[10px] text-slate-400">Loại bỏ nhãn không cần khi hiển thị</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStripHidden(!stripHidden); setResult(null); }}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-900/60 hover:bg-slate-900 rounded-xl border border-slate-800 text-left transition-all"
                  >
                    {stripHidden ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-200 block">Xóa Layer bị ẩn ('hd': true)</span>
                      <span className="text-[10px] text-slate-400">Loại bỏ layer/shape ẩn không dùng</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStripMetadata(!stripMetadata); setResult(null); }}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-900/60 hover:bg-slate-900 rounded-xl border border-slate-800 text-left transition-all"
                  >
                    {stripMetadata ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-200 block">Dọn Metadata After Effects</span>
                      <span className="text-[10px] text-slate-400">Xóa 'mn' và generator (giữ nguyên markers)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMinify(!minify); setResult(null); }}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-900/60 hover:bg-slate-900 rounded-xl border border-slate-800 text-left transition-all"
                  >
                    {minify ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-200 block">Nén khoảng trắng (Minify)</span>
                      <span className="text-[10px] text-slate-400">Xóa tab và dấu xuống dòng thừa</span>
                    </div>
                  </button>
                </div>

                {/* Live Optimization Statistics */}
                {liveOptimization && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <span className="text-[11px] text-emerald-200 font-medium">Kết quả xem trước tối ưu JSON:</span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-400 line-through">{formatBytes(liveOptimization.originalSize)}</span>
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300 font-bold">{formatBytes(liveOptimization.optimizedSize)}</span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] rounded">
                        -{liveOptimization.savedPercent}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic pt-1">
                Bộ tối ưu hóa đang tắt. Tệp JSON sẽ giữ nguyên cấu trúc và dung lượng gốc.
              </p>
            )}
          </div>

          {activeMode === 'jsonToLottie' ? (
            <>
              {/* DotLottie Metadata Settings */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Tên Tác Giả (Author)</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Animation ID</label>
                  <input
                    type="text"
                    value={animationId}
                    onChange={(e) => setAnimationId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Conversion Result & Action */}
              {result ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-200">Đóng Gói .lottie Thành Công!</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/30 text-emerald-200 rounded-full text-[11px] font-extrabold border border-emerald-400/40">
                      Nén {result.compressedPercent}% so với JSON gốc
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">JSON Gốc</span>
                      <span className="text-slate-200 font-bold">{formatBytes(result.rawJsonSize)}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">Tệp .lottie (Zip)</span>
                      <span className="text-emerald-300 font-bold">{formatBytes(result.size)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleDownloadDotLottie}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải Tệp {fileName.replace(/\.json$/i, '')}.lottie</span>
                    </button>
                    <button
                      onClick={handlePreviewDotLottie}
                      className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                      title="Xem Review trực tiếp file .lottie vừa tạo trên Canvas"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem Review</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleConvert}
                  disabled={!currentJson || isConverting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>{isConverting ? 'Đang Xử Lý Nén...' : 'Chuyển Đổi Sang .lottie Ngay'}</span>
                </button>
              )}
            </>
          ) : (
            /* Mode 2: Download / Extract Optimized JSON */
            <div className="space-y-4">
              {currentJson && liveOptimization ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadOptimizedJson}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      Tải Tệp Lottie JSON Đã Tối Ưu ({formatBytes(liveOptimization.optimizedSize)})
                    </span>
                  </button>
                  <button
                    onClick={handlePreviewOptimizedJson}
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    title="Xem Review trực tiếp JSON đã tối ưu trên Canvas"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem Review</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  Chưa có dữ liệu Lottie JSON để tải về.
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

