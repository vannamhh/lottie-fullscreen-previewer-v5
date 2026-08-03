import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DotLottie } from '@lottiefiles/dotlottie-react';
import { HeaderBar } from './components/HeaderBar';
import { LottieCanvas } from './components/LottieCanvas';
import { ControlDock } from './components/ControlDock';
import { InspectorDrawer } from './components/InspectorDrawer';
import { SampleLibraryModal } from './components/SampleLibraryModal';
import { CodeExportModal } from './components/CodeExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { UrlInputModal } from './components/UrlInputModal';
import { ConverterModal } from './components/ConverterModal';
import { DragDropOverlay } from './components/DragDropOverlay';

import { LottieMetadata, PlaybackState, ViewSettings, SampleLottie, CssFilterSettings } from './types';
import {
  parseDotLottieFile,
  parseLottieJsonObject,
  formatBytes,
  getUrlFileName,
  isDotLottieUrl
} from './utils/lottieParser';
import { SAMPLE_LOTTIES } from './data/sampleLotties';
import { addRecentFile, RecentFileItem } from './utils/recentHistory';
import { RecentFilesModal } from './components/RecentFilesModal';
import { CssFiltersModal } from './components/CssFiltersModal';
import { DEFAULT_CSS_FILTERS } from './utils/cssFilterUtils';
import { listenForOpenedFiles } from './utils/tauriBridge';

export const App: React.FC = () => {
  // Animation Sources
  const [fileSourceUrl, setFileSourceUrl] = useState<string | null>(SAMPLE_LOTTIES[0].url);
  const [jsonData, setJsonData] = useState<any | null>(null);
  const [currentSampleId, setCurrentSampleId] = useState<string | undefined>(SAMPLE_LOTTIES[0].id);

  // Metadata & Inspector State
  const [metadata, setMetadata] = useState<LottieMetadata | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Playback State
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: true,
    currentFrame: 0,
    totalFrames: 100,
    currentTime: 0,
    duration: 2,
    speed: 1.0,
    loop: true,
    mode: 'normal'
  });

  // View & Canvas Customization Settings
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    background: 'checkerboard-dark',
    customBgColor: '#1e293b',
    fitMode: 'contain',
    zoom: 1.0,
    panX: 0,
    panY: 0,
    showGrid: false,
    showGuides: false,
    showRulers: false,
    showCenterCrosshair: false,
    controlsHidden: false,
    filters: DEFAULT_CSS_FILTERS
  });

  // UI Modals State
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isConverterModalOpen, setIsConverterModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false);
  const [isRecentModalOpen, setIsRecentModalOpen] = useState<boolean>(false);
  const [isCssFiltersModalOpen, setIsCssFiltersModalOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Refs
  const dotLottieRef = useRef<DotLottie | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const playbackRef = useRef(playbackState);
  playbackRef.current = playbackState;
  const loadListenerTargetRef = useRef<DotLottie | null>(null);
  // Set as soon as the user's own animation lands, so the demo sample fetched at
  // startup cannot overwrite its metadata by resolving late.
  const hasUserFileRef = useRef<boolean>(false);

  /**
   * Swap the canvas source, revoking the object URL of the file we are leaving.
   * Local .lottie files are played from an object URL, and those pin the whole
   * file in memory until released.
   */
  const setSourceUrl = useCallback((url: string | null, isObjectUrl = false) => {
    if (objectUrlRef.current && objectUrlRef.current !== url) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (isObjectUrl && url) objectUrlRef.current = url;
    setFileSourceUrl(url);
  }, []);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  // Load sample on initial load
  useEffect(() => {
    fetch(SAMPLE_LOTTIES[0].url)
      .then(res => res.json())
      .then(json => {
        // A file opened from Finder can beat this request home; if it did, the
        // sample is already irrelevant.
        if (hasUserFileRef.current) return;
        const meta = parseLottieJsonObject(
          json,
          'Success_Celebration.json',
          JSON.stringify(json).length,
          'json'
        );
        setMetadata(meta);
        setPlaybackState(prev => ({
          ...prev,
          totalFrames: meta.totalFrames,
          duration: meta.durationSeconds
        }));
      })
      .catch(err => console.warn('Failed loading initial sample:', err));
  }, []);

  // DotLottie Instance Handler
  const handleDotLottieRef = useCallback((instance: DotLottie | null) => {
    dotLottieRef.current = instance;

    // The player wrapper can hand back an instance it kept alive across a
    // remount; attaching again would double every load event.
    if (instance && loadListenerTargetRef.current !== instance) {
      loadListenerTargetRef.current = instance;
      instance.addEventListener('load', () => {
        const total = Math.round(instance.totalFrames || 100);
        setPlaybackState(prev => ({ ...prev, totalFrames: total }));
      });
    }
  }, []);

  // Frame update callback
  const handleFrameChange = useCallback((frame: number, total: number) => {
    setPlaybackState(prev => ({
      ...prev,
      currentFrame: frame,
      totalFrames: total > 0 ? total : prev.totalFrames
    }));
  }, []);

  // Process File Upload (.lottie or .json)
  const processFile = async (file: File) => {
    hasUserFileRef.current = true;
    setCurrentSampleId(undefined);
    const isDotLottie = file.name.endsWith('.lottie') || file.name.endsWith('.zip');

    if (isDotLottie) {
      try {
        const { metadata: meta, animationJson } = await parseDotLottieFile(file);
        setJsonData(null);
        setSourceUrl(URL.createObjectURL(file), true);
        setMetadata(meta);
        setPlaybackState(prev => ({
          ...prev,
          currentFrame: 0,
          totalFrames: meta.totalFrames,
          duration: meta.durationSeconds,
          isPlaying: true
        }));

        addRecentFile({
          name: file.name,
          format: 'dotlottie',
          sizeFormatted: formatBytes(file.size),
          sizeBytes: file.size,
          jsonData: animationJson
          // No 'url': object URLs die with the tab, so persisting one to history
          // would guarantee a dead link on the next visit.
        });
      } catch (err) {
        alert('Lỗi khi đọc tệp .lottie: ' + (err instanceof Error ? err.message : String(err)));
      }
    } else {
      // Standard Lottie JSON
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const json = JSON.parse(content);
          const meta = parseLottieJsonObject(json, file.name, file.size, 'json');

          setSourceUrl(null);
          setJsonData(json);
          setMetadata(meta);
          setPlaybackState(prev => ({
            ...prev,
            currentFrame: 0,
            totalFrames: meta.totalFrames,
            duration: meta.durationSeconds,
            isPlaying: true
          }));

          addRecentFile({
            name: file.name,
            format: 'json',
            sizeFormatted: formatBytes(file.size),
            sizeBytes: file.size,
            // addRecentFile drops the cached copy on its own if it is too big for
            // localStorage; the entry itself is kept either way.
            jsonData: json
          });
        } catch (err) {
          alert('Lỗi định dạng JSON Lottie không hợp lệ.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Files handed over by macOS — Finder double-click on a .lottie, or "Open
  // With" on a .json. Held in a ref so the subscription is created once while
  // still invoking the current processFile.
  const processFileRef = useRef(processFile);
  processFileRef.current = processFile;

  useEffect(
    () => listenForOpenedFiles(file => { void processFileRef.current(file); }),
    []
  );

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget === null) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  // Select Sample Animation
  const handleSelectSample = (sample: SampleLottie) => {
    setCurrentSampleId(sample.id);
    setJsonData(null);
    setSourceUrl(sample.url);

    fetch(sample.url)
      .then(res => res.json())
      .then(json => {
        const meta = parseLottieJsonObject(json, `${sample.title}.json`, JSON.stringify(json).length, 'json');
        setMetadata(meta);
        setPlaybackState(prev => ({
          ...prev,
          currentFrame: 0,
          totalFrames: meta.totalFrames,
          duration: meta.durationSeconds,
          isPlaying: true
        }));

        addRecentFile({
          name: `${sample.title}.json`,
          format: 'json',
          sizeFormatted: 'Mẫu Lottie',
          sizeBytes: JSON.stringify(json).length,
          url: sample.url,
          sampleId: sample.id
        });
      })
      .catch(() => {});
  };

  // Load URL
  const handleLoadUrl = async (url: string) => {
    setCurrentSampleId(undefined);
    setJsonData(null);
    setSourceUrl(url);
    // Drop the outgoing file's stats right away: leaving them on screen would
    // describe the previous animation while a different one plays.
    setMetadata(null);

    const fileName = getUrlFileName(url);
    const isDotLottie = isDotLottieUrl(url);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const buffer = await res.arrayBuffer();
      const sizeBytes = buffer.byteLength;

      let meta: LottieMetadata;
      let json: any = null;

      if (isDotLottie) {
        const file = new File([buffer], fileName, { type: 'application/zip' });
        ({ metadata: meta, animationJson: json } = await parseDotLottieFile(file));
      } else {
        json = JSON.parse(new TextDecoder().decode(buffer));
        meta = parseLottieJsonObject(json, fileName, sizeBytes, 'json');
      }

      setMetadata(meta);
      setPlaybackState(prev => ({
        ...prev,
        currentFrame: 0,
        totalFrames: meta.totalFrames,
        duration: meta.durationSeconds,
        isPlaying: true
      }));

      addRecentFile({
        name: fileName,
        format: meta.format,
        sizeFormatted: formatBytes(sizeBytes),
        sizeBytes,
        url,
        // A .lottie's inner JSON references images held in the archive, so it is
        // only worth caching for plain JSON animations.
        jsonData: !isDotLottie ? json : undefined
      });
    } catch (err) {
      // The player fetches the URL itself and may well succeed where this read was
      // blocked by CORS, so keep playing and just record the entry without stats.
      console.warn('Không đọc được thông tin tệp từ URL:', err);
      addRecentFile({
        name: fileName,
        format: isDotLottie ? 'dotlottie' : 'json',
        sizeFormatted: 'URL',
        sizeBytes: 0,
        url
      });
    }
  };

  // Handle previewing newly converted file directly on canvas
  const handlePreviewConverted = async (payload: { blob?: Blob; json?: any; name: string; format: 'dotlottie' | 'json' }) => {
    setIsConverterModalOpen(false);
    if (payload.format === 'dotlottie' && payload.blob) {
      const file = new File([payload.blob], payload.name, { type: 'application/zip' });
      await processFile(file);
    } else if (payload.format === 'json' && payload.json) {
      const json = payload.json;
      const jsonStr = JSON.stringify(json);
      const meta = parseLottieJsonObject(json, payload.name, jsonStr.length, 'json');
      setSourceUrl(null);
      setJsonData(json);
      setMetadata(meta);
      setPlaybackState(prev => ({
        ...prev,
        currentFrame: 0,
        totalFrames: meta.totalFrames,
        duration: meta.durationSeconds,
        isPlaying: true
      }));

      addRecentFile({
        name: payload.name,
        format: 'json',
        sizeFormatted: meta.fileSizeFormatted,
        sizeBytes: jsonStr.length,
        jsonData: json
      });
    }
  };

  // Handle selecting an item from recent files history
  const handleSelectRecentFile = async (item: RecentFileItem) => {
    setIsRecentModalOpen(false);
    if (item.jsonData) {
      const json = item.jsonData;
      const jsonStr = JSON.stringify(json);
      const meta = parseLottieJsonObject(json, item.name, jsonStr.length, 'json');
      setSourceUrl(null);
      setJsonData(json);
      setMetadata(meta);
      setPlaybackState(prev => ({
        ...prev,
        currentFrame: 0,
        totalFrames: meta.totalFrames,
        duration: meta.durationSeconds,
        isPlaying: true
      }));
      return;
    }

    const sample = item.sampleId ? SAMPLE_LOTTIES.find(s => s.id === item.sampleId) : undefined;
    if (sample) {
      handleSelectSample(sample);
      return;
    }

    // Object URLs stored by older builds no longer resolve after a reload, and
    // loading one would blank the canvas with nothing but a console error.
    if (item.url && !item.url.startsWith('blob:')) {
      handleLoadUrl(item.url);
      return;
    }

    alert(`Không còn dữ liệu tạm của "${item.name}". Vui lòng mở lại tệp này từ máy tính.`);
    fileInputRef.current?.click();
  };

  // Playback Control Handlers
  //
  // These read the latest playback values through a ref rather than through
  // closures. Depending on playbackState would give every handler a new identity
  // on each frame tick, which defeats the memoized children below and re-subscribes
  // the keyboard listener several times a second.
  const handlePlayPause = useCallback(() => {
    if (!dotLottieRef.current) {
      setPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
      return;
    }

    if (playbackRef.current.isPlaying) {
      dotLottieRef.current.pause();
      setPlaybackState(prev => ({ ...prev, isPlaying: false }));
    } else {
      dotLottieRef.current.play();
      setPlaybackState(prev => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (dotLottieRef.current) {
      dotLottieRef.current.stop();
      dotLottieRef.current.play();
    }
    setPlaybackState(prev => ({ ...prev, currentFrame: 0, isPlaying: true }));
  }, []);

  const handleStepFrame = useCallback((delta: number) => {
    if (dotLottieRef.current) {
      dotLottieRef.current.pause();
      // Valid frames are 0 … totalFrames - 1
      const { totalFrames, currentFrame } = playbackRef.current;
      const maxFrame = Math.max(0, totalFrames - 1);
      const nextFrame = Math.max(0, Math.min(maxFrame, currentFrame + delta));
      dotLottieRef.current.setFrame(nextFrame);
      setPlaybackState(prev => ({ ...prev, currentFrame: nextFrame, isPlaying: false }));
    }
  }, []);

  const handleSeekFrame = useCallback((frame: number) => {
    if (dotLottieRef.current) {
      dotLottieRef.current.setFrame(frame);
    }
    setPlaybackState(prev => ({ ...prev, currentFrame: frame }));
  }, []);

  const handleSetSpeed = useCallback((speed: number) => {
    if (dotLottieRef.current) {
      dotLottieRef.current.setSpeed(speed);
    }
    setPlaybackState(prev => ({ ...prev, speed }));
  }, []);

  const handleToggleLoop = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, loop: !prev.loop }));
  }, []);

  // Reset the view transform: back to 100% zoom with the animation re-centred.
  const handleResetView = useCallback(() => {
    setViewSettings(prev => ({ ...prev, zoom: 1.0, panX: 0, panY: 0 }));
  }, []);

  const handleToggleMode = useCallback(() => {
    const nextMode = playbackRef.current.mode === 'normal' ? 'bounce' : 'normal';
    if (dotLottieRef.current) {
      dotLottieRef.current.setMode(nextMode);
    }
    setPlaybackState(prev => ({ ...prev, mode: nextMode }));
  }, []);

  // Capture Screenshot Frame as PNG
  const handleCaptureFrame = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `lottie-frame-${playbackRef.current.currentFrame}.png`;
      a.click();
    } else {
      alert('Không tìm thấy canvas element để chụp khung hình.');
    }
  }, []);

  // Toggle Fullscreen Mode
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // The browser is the source of truth: Esc and browser-initiated exits never go
  // through the button handler, which would otherwise leave the icon inverted.
  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const isAnyModalOpen =
    isSampleModalOpen ||
    isCodeModalOpen ||
    isConverterModalOpen ||
    isShortcutsModalOpen ||
    isUrlModalOpen ||
    isRecentModalOpen ||
    isCssFiltersModalOpen;

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // A dialog owns the keyboard while it is open
      if (isAnyModalOpen) return;

      // Never steal keys from a focused control: Space must activate the button
      // the user tabbed to, not toggle playback behind it.
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, button, a, [contenteditable="true"]')) return;

      // Pan with Alt + Arrow Keys
      if (e.altKey) {
        switch (e.code) {
          case 'ArrowLeft':
            e.preventDefault();
            setViewSettings(prev => ({ ...prev, panX: prev.panX - 30 }));
            return;
          case 'ArrowRight':
            e.preventDefault();
            setViewSettings(prev => ({ ...prev, panX: prev.panX + 30 }));
            return;
          case 'ArrowUp':
            e.preventDefault();
            setViewSettings(prev => ({ ...prev, panY: prev.panY - 30 }));
            return;
          case 'ArrowDown':
            e.preventDefault();
            setViewSettings(prev => ({ ...prev, panY: prev.panY + 30 }));
            return;
        }
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'KeyF':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'KeyR':
          e.preventDefault();
          handleRestart();
          break;
        case 'KeyH':
          e.preventDefault();
          setViewSettings(prev => ({ ...prev, controlsHidden: !prev.controlsHidden }));
          break;
        case 'KeyL':
          e.preventDefault();
          handleToggleLoop();
          break;
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          setViewSettings(prev => ({ ...prev, zoom: Math.min(5.0, Number((prev.zoom + 0.15).toFixed(2))) }));
          break;
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          setViewSettings(prev => ({ ...prev, zoom: Math.max(0.1, Number((prev.zoom - 0.15).toFixed(2))) }));
          break;
        case 'Digit0':
        case 'Numpad0':
          e.preventDefault();
          handleResetView();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleStepFrame(e.shiftKey ? -10 : -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleStepFrame(e.shiftKey ? 10 : 1);
          break;
        case 'BracketLeft':
          e.preventDefault();
          handleSetSpeed(Math.max(0.25, Number((playbackRef.current.speed - 0.25).toFixed(2))));
          break;
        case 'BracketRight':
          e.preventDefault();
          handleSetSpeed(Math.min(3.0, Number((playbackRef.current.speed + 0.25).toFixed(2))));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // Every handler below is identity-stable, so this subscribes once instead of
    // tearing the listener down and rebuilding it on every playback tick.
  }, [
    isAnyModalOpen,
    handlePlayPause,
    handleToggleFullscreen,
    handleRestart,
    handleToggleLoop,
    handleStepFrame,
    handleSetSpeed,
    handleResetView
  ]);

  // Stable identities for everything handed to the memoized children below —
  // an inline arrow would be a new prop on every render and defeat the memo.
  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);
  const openSampleLibrary = useCallback(() => setIsSampleModalOpen(true), []);
  const closeSampleLibrary = useCallback(() => setIsSampleModalOpen(false), []);
  const openUrlModal = useCallback(() => setIsUrlModalOpen(true), []);
  const closeUrlModal = useCallback(() => setIsUrlModalOpen(false), []);
  const openRecentFiles = useCallback(() => setIsRecentModalOpen(true), []);
  const closeRecentFiles = useCallback(() => setIsRecentModalOpen(false), []);
  const openCssFilters = useCallback(() => setIsCssFiltersModalOpen(true), []);
  const closeCssFilters = useCallback(() => setIsCssFiltersModalOpen(false), []);
  const openCodeExport = useCallback(() => setIsCodeModalOpen(true), []);
  const closeCodeExport = useCallback(() => setIsCodeModalOpen(false), []);
  const openConverter = useCallback(() => setIsConverterModalOpen(true), []);
  const closeConverter = useCallback(() => setIsConverterModalOpen(false), []);
  const openShortcuts = useCallback(() => setIsShortcutsModalOpen(true), []);
  const closeShortcuts = useCallback(() => setIsShortcutsModalOpen(false), []);
  const toggleInspector = useCallback(() => setIsInspectorOpen(prev => !prev), []);
  const closeInspector = useCallback(() => setIsInspectorOpen(false), []);
  const handleLoadError = useCallback((err: string) => console.error(err), []);
  const animationAspectRatio =
    metadata && metadata.width > 0 && metadata.height > 0 ? metadata.width / metadata.height : null;
  const revealControls = useCallback(
    () => setViewSettings(prev => (prev.controlsHidden ? { ...prev, controlsHidden: false } : prev)),
    []
  );
  const handleChangeFilters = useCallback(
    (newFilters: CssFilterSettings) => setViewSettings(prev => ({ ...prev, filters: newFilters })),
    []
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".lottie,.json,.zip"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Clear the value so picking the same file again still fires 'change'
          e.target.value = '';
          if (file) processFile(file);
        }}
        className="hidden"
      />

      {/* Main Fullscreen Canvas */}
      <LottieCanvas
        src={fileSourceUrl}
        data={jsonData}
        viewSettings={viewSettings}
        setViewSettings={setViewSettings}
        isPlaying={playbackState.isPlaying}
        loop={playbackState.loop}
        speed={playbackState.speed}
        aspectRatio={animationAspectRatio}
        onDotLottieRef={handleDotLottieRef}
        onFrameChange={handleFrameChange}
        onLoadError={handleLoadError}
        onCanvasClick={revealControls}
      />

      {/* Floating Header Bar */}
      <HeaderBar
        metadata={metadata}
        viewSettings={viewSettings}
        setViewSettings={setViewSettings}
        onOpenFileClick={openFilePicker}
        onOpenSampleLibrary={openSampleLibrary}
        onOpenUrlModal={openUrlModal}
        onOpenRecentFiles={openRecentFiles}
        onOpenCssFilters={openCssFilters}
        onToggleInspector={toggleInspector}
        onOpenCodeExport={openCodeExport}
        onOpenConverter={openConverter}
        onCaptureFrame={handleCaptureFrame}
        onOpenShortcuts={openShortcuts}
        isInspectorOpen={isInspectorOpen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Floating Bottom Control Dock */}
      <ControlDock
        playbackState={playbackState}
        viewSettings={viewSettings}
        setViewSettings={setViewSettings}
        onPlayPause={handlePlayPause}
        onRestart={handleRestart}
        onStepFrame={handleStepFrame}
        onSeekFrame={handleSeekFrame}
        onSetSpeed={handleSetSpeed}
        onToggleLoop={handleToggleLoop}
        onToggleMode={handleToggleMode}
        onResetView={handleResetView}
      />

      {/* Side Inspector Drawer */}
      <InspectorDrawer
        metadata={metadata}
        isOpen={isInspectorOpen}
        onClose={closeInspector}
      />

      {/* Modals — mounted only while open, so a closed dialog costs nothing per frame */}
      {isSampleModalOpen && (
        <SampleLibraryModal
          isOpen
          onClose={closeSampleLibrary}
          onSelectSample={handleSelectSample}
          currentSampleId={currentSampleId}
        />
      )}

      {isCodeModalOpen && (
        <CodeExportModal
          isOpen
          onClose={closeCodeExport}
          metadata={metadata}
          fileSourceUrl={fileSourceUrl}
        />
      )}

      {isShortcutsModalOpen && <ShortcutsModal isOpen onClose={closeShortcuts} />}

      {isUrlModalOpen && (
        <UrlInputModal isOpen onClose={closeUrlModal} onLoadUrl={handleLoadUrl} />
      )}

      {isConverterModalOpen && (
        <ConverterModal
          isOpen
          onClose={closeConverter}
          metadata={metadata}
          jsonData={jsonData}
          fileSourceUrl={fileSourceUrl}
          onPreviewConverted={handlePreviewConverted}
        />
      )}

      {isRecentModalOpen && (
        <RecentFilesModal
          isOpen
          onClose={closeRecentFiles}
          onSelectRecentFile={handleSelectRecentFile}
          onOpenFileClick={openFilePicker}
        />
      )}

      {isCssFiltersModalOpen && (
        <CssFiltersModal
          isOpen
          onClose={closeCssFilters}
          filters={viewSettings.filters}
          onChangeFilters={handleChangeFilters}
        />
      )}

      {/* Drag and Drop Fullscreen Overlay */}
      <DragDropOverlay isDragging={isDragging} />
    </div>
  );
};

export default App;
