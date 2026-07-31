import React, { useState } from 'react';
import { 
  FolderOpen, 
  Sparkles, 
  Link as LinkIcon, 
  Info, 
  Code2, 
  Camera, 
  Maximize, 
  Minimize, 
  Keyboard, 
  Eye, 
  EyeOff, 
  Download,
  Palette,
  RefreshCw,
  History,
  Sliders
} from 'lucide-react';
import { LottieMetadata, ViewSettings } from '../types';

interface HeaderBarProps {
  metadata: LottieMetadata | null;
  viewSettings: ViewSettings;
  setViewSettings: React.Dispatch<React.SetStateAction<ViewSettings>>;
  onOpenFileClick: () => void;
  onOpenSampleLibrary: () => void;
  onOpenUrlModal: () => void;
  onOpenRecentFiles: () => void;
  onOpenCssFilters: () => void;
  onToggleInspector: () => void;
  onOpenCodeExport: () => void;
  onOpenConverter: () => void;
  onCaptureFrame: () => void;
  onOpenShortcuts: () => void;
  isInspectorOpen: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  metadata,
  viewSettings,
  setViewSettings,
  onOpenFileClick,
  onOpenSampleLibrary,
  onOpenUrlModal,
  onOpenRecentFiles,
  onOpenCssFilters,
  onToggleInspector,
  onOpenCodeExport,
  onOpenConverter,
  onCaptureFrame,
  onOpenShortcuts,
  isInspectorOpen,
  isFullscreen,
  onToggleFullscreen
}) => {
  return (
    <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
      viewSettings.controlsHidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
    }`}>
      <div className="mx-3 mt-3 px-4 py-2.5 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl flex items-center justify-between gap-4 text-slate-200">
        
        {/* Left Section: Logo & File Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
                Lottie Fullscreen
              </h1>
              <p className="text-[10px] font-medium text-purple-400/90 tracking-wide">
                PREVIEW & REVIEW QA
              </p>
            </div>
          </div>

          {/* File Meta Pill */}
          {metadata && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-800/60 border border-slate-700/50 rounded-xl text-xs truncate max-w-xs">
              <span className={`px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                metadata.format === 'dotlottie' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                .{metadata.format}
              </span>
              <span className="font-medium text-slate-200 truncate">{metadata.fileName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono text-[11px]">{metadata.width}x{metadata.height}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono text-[11px]">{metadata.fps} fps</span>
            </div>
          )}
        </div>

        {/* Center / Right Section: Main Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* File Open */}
          <button
            onClick={onOpenFileClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white border border-indigo-400/40 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.03] active:scale-95"
            title="Mở tệp .lottie hoặc .json"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-100" />
            <span className="hidden sm:inline">Mở Tệp</span>
          </button>

          {/* Samples */}
          <button
            onClick={onOpenSampleLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-semibold shadow-sm shadow-amber-500/10 transition-all hover:scale-[1.03] hover:text-white"
            title="Chọn animation mẫu"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span className="hidden md:inline">Thư Viện Mẫu</span>
          </button>

          {/* URL Input */}
          <button
            onClick={onOpenUrlModal}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border border-sky-500/40 rounded-xl text-xs font-semibold shadow-sm shadow-sky-500/10 transition-all hover:scale-[1.03] hover:text-white"
            title="Tải từ URL"
          >
            <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xl:inline">Nhập URL</span>
          </button>

          {/* Recent Files / History */}
          <button
            onClick={onOpenRecentFiles}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 border border-violet-500/40 rounded-xl text-xs font-semibold shadow-sm shadow-violet-500/10 transition-all hover:scale-[1.03] hover:text-white"
            title="Lịch sử tệp gần đây & bộ sưu tập"
          >
            <History className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden xl:inline">Lịch Sử Tệp</span>
          </button>

          {/* CSS Filters Button */}
          <button
            onClick={onOpenCssFilters}
            className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.03] ${
              viewSettings.filters && viewSettings.filters.preset !== 'normal'
                ? 'bg-fuchsia-600/30 border border-fuchsia-500/80 text-fuchsia-100 shadow-lg shadow-fuchsia-600/25'
                : 'bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-200 border border-fuchsia-500/40 shadow-sm shadow-fuchsia-500/10 hover:text-white'
            }`}
            title="Bộ lọc màu & Hiệu ứng Canvas (CSS Filters)"
          >
            <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="hidden xl:inline">Bộ Lọc Màu</span>
            {viewSettings.filters && viewSettings.filters.preset !== 'normal' && (
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
            )}
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-0.5 hidden sm:block" />

          {/* Screenshot / Capture */}
          <button
            onClick={onCaptureFrame}
            className="p-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 rounded-xl transition-all hover:scale-[1.03]"
            title="Chụp ảnh khung hình hiện tại (PNG)"
          >
            <Camera className="w-4 h-4 text-teal-400" />
          </button>

          {/* Code Export */}
          <button
            onClick={onOpenCodeExport}
            className="p-2 bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/40 rounded-xl transition-all hover:scale-[1.03]"
            title="Xuất mã nguồn (React, Web Component, Mobile)"
          >
            <Code2 className="w-4 h-4 text-pink-400" />
          </button>

          {/* Converter Button */}
          <button
            onClick={onOpenConverter}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-semibold shadow-sm shadow-emerald-500/10 transition-all hover:scale-[1.03]"
            title="Chuyển đổi *.json thành *.lottie"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Chuyển Đổi .lottie</span>
          </button>

          {/* Inspector Panel Toggle */}
          <button
            onClick={onToggleInspector}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.03] ${
              isInspectorOpen 
                ? 'bg-blue-600/30 border border-blue-500/80 text-blue-100 shadow-lg shadow-blue-600/25' 
                : 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-200 border border-blue-500/40'
            }`}
            title="Mở bảng phân tích chi tiết Layer, Màu sắc, Asset"
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline">Phân Tích</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

          {/* Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            className="p-2 bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/40 rounded-xl transition-all hover:scale-[1.03]"
            title="Phím tắt bàn phím (Help)"
          >
            <Keyboard className="w-4 h-4 text-orange-400" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 rounded-xl transition-all hover:scale-[1.03]"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Bật toàn màn hình trình duyệt'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-purple-400" /> : <Maximize className="w-4 h-4 text-purple-400" />}
          </button>
        </div>

      </div>
    </header>
  );
};
