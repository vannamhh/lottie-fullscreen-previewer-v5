import React from 'react';
import {
  Camera,
  Code2,
  FolderOpen,
  History,
  Keyboard,
  Layers,
  LayoutGrid,
  Link as LinkIcon,
  Maximize,
  Minimize,
  Palette,
  RefreshCw,
  Sparkles
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

/**
 * Toolbar styling is centralised here on purpose.
 *
 * Colour carries one meaning only: indigo marks the primary action and anything
 * currently switched on. Every other control stays neutral, so a glance at the
 * bar answers "what is active?" rather than "which colour was that button?".
 */
const BTN = 'flex items-center gap-1.5 h-8 rounded-lg text-xs font-medium whitespace-nowrap transition-colors';
const LABELLED = 'px-2.5';
const ICON_ONLY = 'w-8 justify-center';

const NEUTRAL = 'bg-slate-800/60 hover:bg-slate-700/70 text-slate-300 hover:text-white border border-slate-700/60';
const PRIMARY = 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-sm shadow-indigo-600/30';
const ACTIVE = 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/60';

const Divider: React.FC = () => (
  <div className="h-5 w-px bg-slate-700/60 mx-1 shrink-0" aria-hidden="true" />
);

const HeaderBarComponent: React.FC<HeaderBarProps> = ({
  metadata,
  viewSettings,
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
  const filtersActive = Boolean(viewSettings.filters && viewSettings.filters.preset !== 'normal');

  return (
    <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
      viewSettings.controlsHidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
    }`}>
      <div className="mx-3 mt-3 px-3 py-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl flex items-center justify-between gap-4 text-slate-200">

        {/* Identity and current file */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 p-px shadow-sm shadow-indigo-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div className="hidden sm:block leading-tight">
              <h1 className="text-sm font-semibold text-white whitespace-nowrap">Lottie Previewer</h1>
              <p className="text-[10px] font-medium text-slate-500 tracking-wider whitespace-nowrap">
                PREVIEW &amp; QA
              </p>
            </div>
          </div>

          {metadata && (
            <div className="hidden lg:flex items-center gap-2 h-8 px-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs min-w-0">
              <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded shrink-0 ${
                metadata.format === 'dotlottie'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-amber-500/15 text-amber-300'
              }`}>
                {metadata.format === 'dotlottie' ? 'lottie' : 'json'}
              </span>
              <span className="font-medium text-slate-200 truncate max-w-[16rem]">{metadata.fileName}</span>
              <span className="text-slate-600 shrink-0">·</span>
              <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap shrink-0">
                {metadata.width}×{metadata.height}
              </span>
              <span className="text-slate-600 shrink-0">·</span>
              <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap shrink-0">
                {metadata.fps} fps
              </span>
            </div>
          )}
        </div>

        {/* Actions, grouped by workflow: source → review → export → app */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* Source */}
          <button onClick={onOpenFileClick} className={`${BTN} ${LABELLED} ${PRIMARY}`} title="Open a .lottie or .json file">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Open</span>
          </button>

          <button onClick={onOpenSampleLibrary} className={`${BTN} ${LABELLED} ${NEUTRAL}`} title="Browse the sample library">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden lg:inline">Samples</span>
          </button>

          <button onClick={onOpenUrlModal} className={`${BTN} ${LABELLED} ${NEUTRAL}`} title="Load an animation from a URL">
            <LinkIcon className="w-4 h-4" />
            <span className="hidden lg:inline">URL</span>
          </button>

          <button onClick={onOpenRecentFiles} className={`${BTN} ${LABELLED} ${NEUTRAL}`} title="Recently opened files">
            <History className="w-4 h-4" />
            <span className="hidden lg:inline">Recent</span>
          </button>

          <Divider />

          {/* Review */}
          <button
            onClick={onToggleInspector}
            className={`${BTN} ${LABELLED} ${isInspectorOpen ? ACTIVE : NEUTRAL}`}
            title="Inspect layers, colours and assets"
            aria-pressed={isInspectorOpen}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden lg:inline">Inspect</span>
          </button>

          <button
            onClick={onOpenCssFilters}
            className={`${BTN} ${LABELLED} ${filtersActive ? ACTIVE : NEUTRAL}`}
            title="Colour filters and canvas effects"
            aria-pressed={filtersActive}
          >
            <Palette className="w-4 h-4" />
            <span className="hidden lg:inline">Filters</span>
            {filtersActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
          </button>

          <Divider />

          {/* Export */}
          <button onClick={onCaptureFrame} className={`${BTN} ${ICON_ONLY} ${NEUTRAL}`} title="Capture the current frame as PNG" aria-label="Capture frame">
            <Camera className="w-4 h-4" />
          </button>

          <button onClick={onOpenCodeExport} className={`${BTN} ${ICON_ONLY} ${NEUTRAL}`} title="Export embed code" aria-label="Export code">
            <Code2 className="w-4 h-4" />
          </button>

          <button onClick={onOpenConverter} className={`${BTN} ${LABELLED} ${NEUTRAL}`} title="Convert between .json and .lottie">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden xl:inline">Convert</span>
          </button>

          <Divider />

          {/* App */}
          <button onClick={onOpenShortcuts} className={`${BTN} ${ICON_ONLY} ${NEUTRAL}`} title="Keyboard shortcuts" aria-label="Keyboard shortcuts">
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleFullscreen}
            className={`${BTN} ${ICON_ONLY} ${isFullscreen ? ACTIVE : NEUTRAL}`}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
};

export const HeaderBar = React.memo(HeaderBarComponent);
