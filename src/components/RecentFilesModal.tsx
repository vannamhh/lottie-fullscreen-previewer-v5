import React, { useState, useEffect } from 'react';
import { DotLottieReact, DotLottie } from '@lottiefiles/dotlottie-react';
import { 
  X, 
  History, 
  Star, 
  Trash2, 
  FileJson, 
  Sparkles, 
  Search, 
  ExternalLink,
  FolderOpen,
  Clock,
  HardDrive
} from 'lucide-react';
import { 
  RecentFileItem, 
  getRecentFiles, 
  toggleFavoriteRecentFile, 
  removeRecentFile, 
  clearRecentFiles 
} from '../utils/recentHistory';
import { formatBytes } from '../utils/lottieParser';
import { SAMPLE_LOTTIES } from '../data/sampleLotties';

interface RecentFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecentFile: (item: RecentFileItem) => void;
  onOpenFileClick: () => void;
}

const RecentFileRow: React.FC<{
  item: RecentFileItem;
  onSelect: (item: RecentFileItem) => void;
  onToggleStar: (e: React.MouseEvent, id: string) => void;
  onRemove: (e: React.MouseEvent, id: string) => void;
  formatRelativeTime: (timestamp: number) => string;
}> = ({ item, onSelect, onToggleStar, onRemove, formatRelativeTime }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);

  let src = item.url;
  let data = item.jsonData;

  // Ignore expired blob URLs from previous sessions
  if (src && src.startsWith('blob:')) {
    src = undefined;
  }

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      data = null;
    }
  }

  if (!src && !data && item.sampleId) {
    const sample = SAMPLE_LOTTIES.find(s => s.id === item.sampleId);
    if (sample) src = sample.url;
  }

  useEffect(() => {
    if (!dotLottie) return;
    if (isHovered) {
      dotLottie.play();
    }
  }, [isHovered, dotLottie]);

  const hasSource = Boolean(data || src);

  return (
    <div
      onClick={() => onSelect(item)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative p-3 sm:p-3.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/90 hover:border-indigo-500/60 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 shadow-md hover:shadow-xl hover:shadow-indigo-500/10"
    >
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
        {/* Animated Thumbnail Container - Bigger Box, No Hover Scale Zoom */}
        <div className="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32 my-0.5">
          <div className={`w-full h-full rounded-2xl bg-slate-900/90 border overflow-hidden flex items-center justify-center transition-all duration-200 relative ${
            isHovered
              ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-500/20 bg-slate-950'
              : 'border-slate-800/80 group-hover:border-slate-700'
          }`}>
            {data ? (
              <div className="w-full h-full p-2 flex items-center justify-center">
                <DotLottieReact
                  data={data}
                  loop={true}
                  autoplay={true}
                  dotLottieRefCallback={setDotLottie}
                  style={{ width: '100%', height: '100%' }}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
            ) : src ? (
              <div className="w-full h-full p-2 flex items-center justify-center">
                <DotLottieReact
                  src={src}
                  loop={true}
                  autoplay={true}
                  dotLottieRefCallback={setDotLottie}
                  style={{ width: '100%', height: '100%' }}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 text-center">
                {item.format === 'dotlottie' ? (
                  <Sparkles className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <FileJson className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                )}
                <span className="text-[10px] font-mono text-slate-400 mt-1.5 font-bold">.{item.format}</span>
              </div>
            )}

            {/* Live Auto-Review Badge */}
            {hasSource && (
              <div className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-white text-[8px] font-extrabold uppercase rounded-md shadow flex items-center gap-1 backdrop-blur-sm transition-opacity ${
                isHovered ? 'bg-indigo-600 opacity-100' : 'bg-slate-800/80 opacity-70'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Review
              </div>
            )}
          </div>
        </div>

        {/* File Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
              {item.name}
            </p>
            <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded shrink-0 ${
              item.format === 'dotlottie' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              .{item.format}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 mt-1 font-mono">
            <span>{formatBytes(item.sizeBytes)}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(item.updatedAt)}
            </span>
            {item.url && (
              <>
                <span>•</span>
                <span className="text-indigo-400 text-[10px] font-sans">URL/Mẫu</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={(e) => onToggleStar(e, item.id)}
          className={`p-2 rounded-xl transition-all ${
            item.isFavorite
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
          }`}
          title={item.isFavorite ? 'Bỏ khỏi danh sách Yêu thích' : 'Thêm vào danh sách Yêu thích'}
        >
          <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        <button
          onClick={(e) => onRemove(e, item.id)}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all"
          title="Xóa tệp này khỏi lịch sử"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          className="px-3 py-2 bg-indigo-600 group-hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1 transition-all hover:scale-105"
        >
          <span>Mở Tệp</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const RecentFilesModal: React.FC<RecentFilesModalProps> = ({
  isOpen,
  onClose,
  onSelectRecentFile,
  onOpenFileClick
}) => {
  const [items, setItems] = useState<RecentFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'json' | 'dotlottie'>('all');

  useEffect(() => {
    if (isOpen) {
      setItems(getRecentFiles());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = toggleFavoriteRecentFile(id);
    setItems(updated);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = removeRecentFile(id);
    setItems(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tệp gần đây không?')) {
      const updated = clearRecentFiles();
      setItems(updated);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'favorites') return !!item.isFavorite;
    if (activeTab === 'json') return item.format === 'json';
    if (activeTab === 'dotlottie') return item.format === 'dotlottie';
    return true;
  });

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lịch Sử Tệp & Bộ Sưu Tập Gần Đây</h2>
              <p className="text-xs text-slate-400">Các tệp Lottie đã từng mở được lưu trữ cục bộ để truy cập lại nhanh</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Search & Tabs */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tệp trong lịch sử..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-2 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Xóa toàn bộ lịch sử"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa Lịch Sử</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1 transition-all ${
                activeTab === 'favorites'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>Yêu thích ({items.filter(i => i.isFavorite).length})</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === 'json'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              JSON ({items.filter(i => i.format === 'json').length})
            </button>
            <button
              onClick={() => setActiveTab('dotlottie')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === 'dotlottie'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              .dotlottie ({items.filter(i => i.format === 'dotlottie').length})
            </button>
          </div>
        </div>

        {/* Item List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <RecentFileRow
                key={item.id}
                item={item}
                onSelect={(selected) => {
                  onSelectRecentFile(selected);
                  onClose();
                }}
                onToggleStar={handleToggleStar}
                onRemove={handleRemove}
                formatRelativeTime={formatRelativeTime}
              />
            ))
          ) : (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <HardDrive className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {searchQuery ? 'Không tìm thấy tệp phù hợp với từ khóa' : 'Chưa có lịch sử tệp nào.'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenFileClick();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                Mở Tệp Lottie Đầu Tiên
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
