import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Repeat, 
  Repeat1, 
  Shuffle, 
  Gauge, 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Eye, 
  Palette, 
  SlidersHorizontal,
  Maximize2,
  Crosshair
} from 'lucide-react';
import { PlaybackState, ViewSettings, BackgroundType, CanvasFitMode } from '../types';

// Module scope: these never change, so rebuilding them on every playback tick
// was pure garbage for the collector.
const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

const BG_OPTIONS: Array<{ id: BackgroundType; label: string; preview: string }> = [
  { id: 'checkerboard-dark', label: 'Dark Grid', preview: 'bg-checkerboard-dark border-slate-700' },
  { id: 'checkerboard-light', label: 'Light Grid', preview: 'bg-checkerboard-light border-slate-300' },
  { id: 'solid-dark', label: 'Dark Solid', preview: 'bg-slate-900 border-slate-700' },
  { id: 'solid-white', label: 'Pure White', preview: 'bg-white border-slate-300' },
  { id: 'solid-black', label: 'Pure Black', preview: 'bg-black border-slate-800' },
  { id: 'gradient-purple', label: 'Purple Dark', preview: 'bg-gradient-to-r from-slate-900 to-purple-950 border-purple-800' },
  { id: 'gradient-sunset', label: 'Sunset Glow', preview: 'bg-gradient-to-r from-amber-950 to-rose-950 border-rose-800' },
  { id: 'gradient-cyber', label: 'Cyber Blue', preview: 'bg-gradient-to-r from-slate-950 to-cyan-950 border-cyan-800' }
];

const FIT_OPTIONS: Array<{ id: CanvasFitMode; label: string }> = [
  { id: 'contain', label: 'Contain (Fit View)' },
  { id: 'cover', label: 'Cover (Fill Screen)' },
  { id: 'fill', label: 'Fill (Stretch)' },
  { id: 'original', label: 'Original Size (1:1)' },
  { id: 'custom', label: 'Custom Zoom' }
];

interface ControlDockProps {
  playbackState: PlaybackState;
  viewSettings: ViewSettings;
  setViewSettings: React.Dispatch<React.SetStateAction<ViewSettings>>;
  onPlayPause: () => void;
  onRestart: () => void;
  onStepFrame: (delta: number) => void;
  onSeekFrame: (frame: number) => void;
  onSetSpeed: (speed: number) => void;
  onToggleLoop: () => void;
  onToggleMode: () => void;
}

const ControlDockComponent: React.FC<ControlDockProps> = ({
  playbackState,
  viewSettings,
  setViewSettings,
  onPlayPause,
  onRestart,
  onStepFrame,
  onSeekFrame,
  onSetSpeed,
  onToggleLoop,
  onToggleMode
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showFitMenu, setShowFitMenu] = useState(false);

  // Frames are 0-indexed, so the last one is totalFrames - 1
  const maxFrame = Math.max(0, (playbackState.totalFrames || 100) - 1);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 pointer-events-none transition-all duration-300 ${
      viewSettings.controlsHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
    }`}>
      <div className="max-w-4xl mx-auto px-3 pb-3 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5">
          
          {/* Timeline & Scrub Bar Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-semibold">Frame {playbackState.currentFrame}</span>
                <span className="text-slate-600">/</span>
                <span>{playbackState.totalFrames}</span>
              </div>

              <div className="flex items-center gap-2">
                <span>{(playbackState.currentFrame / (playbackState.totalFrames || 60) * (playbackState.duration || 2)).toFixed(2)}s</span>
                <span className="text-slate-600">/</span>
                <span>{(playbackState.duration || 2).toFixed(2)}s</span>
              </div>
            </div>

            {/* Timeline Range Input */}
            <div className="relative group flex items-center py-1">
              <input
                type="range"
                min={0}
                max={maxFrame}
                value={playbackState.currentFrame}
                onChange={(e) => onSeekFrame(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Main Control Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
            
            {/* Left Controls: Step & Playback Buttons */}
            <div className="flex items-center gap-1">
              
              {/* Restart */}
              <button
                onClick={onRestart}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all"
                title="Phát lại từ đầu (R)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Step Back 1 Frame */}
              <button
                onClick={() => onStepFrame(-1)}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all"
                title="Lùi 1 Frame (←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                onClick={onPlayPause}
                className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/40 transition-all hover:scale-105 active:scale-95 mx-1"
                title={playbackState.isPlaying ? 'Tạm dừng (Space)' : 'Phát (Space)'}
              >
                {playbackState.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Step Forward 1 Frame */}
              <button
                onClick={() => onStepFrame(1)}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all"
                title="Tới 1 Frame (→)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

              {/* Loop / Mode Toggle */}
              <button
                onClick={onToggleLoop}
                className={`p-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                  playbackState.loop 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
                title={playbackState.loop ? 'Đang Lặp (Loop On)' : 'Phát 1 lần (Loop Off)'}
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* Mode Toggle (Bounce / Normal) */}
              <button
                onClick={onToggleMode}
                className={`p-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                  playbackState.mode === 'bounce' 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
                title={playbackState.mode === 'bounce' ? 'Chế độ Bounce (Yoyo)' : 'Chế độ Normal'}
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>

            {/* Middle Section: Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold transition-all"
                title="Tốc độ phát"
              >
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                <span>{playbackState.speed}x</span>
              </button>

              {/* Speed Popover Menu */}
              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col gap-1 w-28 text-xs font-medium z-40">
                  <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1">Tốc Độ Phát</span>
                  {SPEED_OPTIONS.map(spd => (
                    <button
                      key={spd}
                      onClick={() => {
                        onSetSpeed(spd);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-left transition-all ${
                        playbackState.speed === spd
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {spd}x {spd === 1.0 ? '(Chuẩn)' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Controls: Background, Zoom, Canvas Tools */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              
              {/* Background Color Picker Popover */}
              <div className="relative">
                <button
                  onClick={() => setShowBgMenu(!showBgMenu)}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
                  title="Thay đổi màu nền canvas"
                >
                  <Palette className="w-4 h-4 text-purple-400" />
                </button>

                {showBgMenu && (
                  <div className="absolute bottom-full mb-2 right-0 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl grid grid-cols-2 gap-1.5 w-56 text-xs z-40">
                    <span className="col-span-2 text-[10px] uppercase font-bold text-slate-500 px-1 py-0.5">Màu Nền Canvas</span>
                    {BG_OPTIONS.map(bg => (
                      <button
                        key={bg.id}
                        onClick={() => {
                          setViewSettings(prev => ({ ...prev, background: bg.id }));
                          setShowBgMenu(false);
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all text-left ${
                          viewSettings.background === bg.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-white font-semibold'
                            : 'border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border ${bg.preview}`} />
                        <span className="text-[11px] truncate">{bg.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fit Mode Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowFitMenu(!showFitMenu)}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
                  title="Tỷ lệ khung hình / Kích thước"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {showFitMenu && (
                  <div className="absolute bottom-full mb-2 right-0 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col gap-1 w-44 text-xs z-40">
                    <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1">Chế Độ Hiển Thị</span>
                    {FIT_OPTIONS.map(fit => (
                      <button
                        key={fit.id}
                        onClick={() => {
                          setViewSettings(prev => ({ ...prev, fitMode: fit.id, zoom: 1 }));
                          setShowFitMenu(false);
                        }}
                        className={`px-2 py-1 rounded-lg text-left transition-all ${
                          viewSettings.fitMode === fit.id
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {fit.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Zoom Out / In */}
              <div className="hidden md:flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60">
                <button
                  onClick={() => setViewSettings(prev => ({ ...prev, zoom: Math.max(0.2, Number((prev.zoom - 0.2).toFixed(1))) }))}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-all"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-300 px-1 min-w-[36px] text-center">
                  {Math.round(viewSettings.zoom * 100)}%
                </span>
                <button
                  onClick={() => setViewSettings(prev => ({ ...prev, zoom: Math.min(4.0, Number((prev.zoom + 0.2).toFixed(1))) }))}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-all"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toggle Grid */}
              <button
                onClick={() => setViewSettings(prev => ({ ...prev, showGrid: !prev.showGrid }))}
                className={`p-2 rounded-xl transition-all ${
                  viewSettings.showGrid ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Lưới định vị (Grid Mesh)"
              >
                <Grid className="w-4 h-4" />
              </button>

              {/* Toggle Center Crosshair */}
              <button
                onClick={() => setViewSettings(prev => ({ ...prev, showCenterCrosshair: !prev.showCenterCrosshair }))}
                className={`p-2 rounded-xl transition-all ${
                  viewSettings.showCenterCrosshair ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Tâm căn chỉnh (Crosshair)"
              >
                <Crosshair className="w-4 h-4" />
              </button>

              {/* Hide Controls */}
              <button
                onClick={() => setViewSettings(prev => ({ ...prev, controlsHidden: true }))}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
                title="Ẩn thanh công cụ (Phím H)"
              >
                <Eye className="w-4 h-4" />
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export const ControlDock = React.memo(ControlDockComponent);
