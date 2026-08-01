import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { DotLottie } from '@lottiefiles/dotlottie-react';
import { LottiePlayer } from '../utils/lottiePlayer';
import { ViewSettings } from '../types';
import { getFilterCssString } from '../utils/cssFilterUtils';
import { getRenderPixelRatio } from '../utils/canvasScale';

const RESIZE_DEBOUNCE_MS = 120;

/** ~15Hz: smooth enough for a frame counter, a quarter of the re-renders of 60Hz */
const FRAME_UPDATE_INTERVAL_MS = 66;

interface LottieCanvasProps {
  src: string | null;
  data: any | null;
  viewSettings: ViewSettings;
  setViewSettings: React.Dispatch<React.SetStateAction<ViewSettings>>;
  // Only the fields the player actually consumes: taking the whole playbackState
  // would re-render the canvas on every frame tick for a value it never reads.
  isPlaying: boolean;
  loop: boolean;
  speed: number;
  /** Animation width/height. Lets the canvas match the artwork instead of the viewport. */
  aspectRatio?: number | null;
  onDotLottieRef: (dotLottie: DotLottie | null) => void;
  onFrameChange: (frame: number, total: number) => void;
  onLoadError: (error: string) => void;
  onCanvasClick: () => void;
}

const LottieCanvasComponent: React.FC<LottieCanvasProps> = ({
  src,
  data,
  viewSettings,
  setViewSettings,
  isPlaying,
  loop,
  speed,
  aspectRatio,
  onDotLottieRef,
  onFrameChange,
  onLoadError,
  onCanvasClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const dotLottieRef = useRef<DotLottie | null>(null);
  const resizeTimerRef = useRef<number | undefined>(undefined);
  const frameListenerRef = useRef<((evt: { currentFrame: number }) => void) | null>(null);
  const lastFrameEmitRef = useRef(0);
  const panFrameRef = useRef<number | null>(null);

  // 'token' forces the re-render effect to run even when the ratio itself is
  // unchanged — a zoom from 1.0 to 1.15 needs a re-raster just the same.
  const [renderScale, setRenderScale] = useState<{ ratio: number; token: number }>(() => ({
    ratio: typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
    token: 0
  }));

  const renderConfig = useMemo(
    () => ({ autoResize: true, devicePixelRatio: renderScale.ratio }),
    [renderScale.ratio]
  );

  // Recompute the pixel budget once the zoom settles. Doing it on every wheel
  // tick would reallocate a multi-megapixel render target per frame.
  useEffect(() => {
    const schedule = () => {
      window.clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = window.setTimeout(() => {
        const canvas = containerRef.current?.querySelector('canvas');
        if (!canvas) return;
        setRenderScale(prev => ({
          ratio: getRenderPixelRatio(canvas.clientWidth, canvas.clientHeight, viewSettings.zoom, {
            isPlaying
          }),
          token: prev.token + 1
        }));
      }, RESIZE_DEBOUNCE_MS);
    };

    schedule();
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('resize', schedule);
      window.clearTimeout(resizeTimerRef.current);
    };
    // Pausing re-runs this and restores full detail; starting playback trades it
    // back for frame rate.
  }, [viewSettings.zoom, viewSettings.fitMode, aspectRatio, isPlaying]);

  // Effects run child-first, so DotLottieReact has already pushed the new
  // devicePixelRatio through setRenderConfig by the time this runs; resize() is
  // what actually rebuilds the backing store and redraws.
  useEffect(() => {
    dotLottieRef.current?.resize();
  }, [renderScale]);

  // Handle dotLottie instance reference callback
  const handleDotLottieRef = useCallback((instance: DotLottie | null) => {
    // Detach from the outgoing instance, or the listeners pile up every time the
    // player remounts (StrictMode alone mounts it twice) and each frame then
    // fires the update N times over.
    const previous = dotLottieRef.current;
    if (previous && frameListenerRef.current) {
      previous.removeEventListener('frame', frameListenerRef.current);
    }
    frameListenerRef.current = null;

    dotLottieRef.current = instance;
    onDotLottieRef(instance);

    if (instance) {
      // The player emits 'frame' on every rendered frame. Forwarding all of them
      // would re-render the React tree 60x/second for a counter and a slider the
      // eye reads fine at 15Hz, which is where the stutter comes from.
      const onFrame = (evt: { currentFrame: number }) => {
        if (typeof evt.currentFrame !== 'number') return;

        const now = performance.now();
        if (now - lastFrameEmitRef.current < FRAME_UPDATE_INTERVAL_MS) return;
        lastFrameEmitRef.current = now;

        onFrameChange(Math.round(evt.currentFrame), Math.round(instance.totalFrames || 0));
      };

      frameListenerRef.current = onFrame;
      instance.addEventListener('frame', onFrame);
    }
  }, [onDotLottieRef, onFrameChange]);

  // Handle Wheel Scroll Zooming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Zoom factor calculation
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      
      setViewSettings(prev => {
        const currentZoom = prev.zoom || 1.0;
        const newZoom = Math.max(0.1, Math.min(5.0, Number((currentZoom * zoomFactor).toFixed(2))));
        
        // Focal point adjustment calculation
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const scaleRatio = newZoom / currentZoom;
        const newPanX = Math.round(mouseX - (mouseX - prev.panX) * scaleRatio);
        const newPanY = Math.round(mouseY - (mouseY - prev.panY) * scaleRatio);

        return {
          ...prev,
          zoom: newZoom,
          panX: newPanX,
          panY: newPanY
        };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [setViewSettings]);

  // Determine Background CSS Classes / Styles
  const getBackgroundStyle = () => {
    switch (viewSettings.background) {
      case 'checkerboard-dark':
        return { className: 'bg-checkerboard-dark' };
      case 'checkerboard-light':
        return { className: 'bg-checkerboard-light' };
      case 'solid-dark':
        return { style: { backgroundColor: '#0f172a' } };
      case 'solid-white':
        return { style: { backgroundColor: '#ffffff' } };
      case 'solid-black':
        return { style: { backgroundColor: '#000000' } };
      case 'gradient-purple':
        return { className: 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950' };
      case 'gradient-sunset':
        return { className: 'bg-gradient-to-br from-amber-950 via-rose-950 to-purple-950' };
      case 'gradient-cyber':
        return { className: 'bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950' };
      case 'custom':
        return { style: { backgroundColor: viewSettings.customBgColor || '#1e293b' } };
      default:
        return { className: 'bg-checkerboard-dark' };
    }
  };

  // Determine Container Fit / Scaling transform
  const getPlayerContainerStyle = (): React.CSSProperties => {
    const scale = viewSettings.zoom;
    const transform = `translate(${viewSettings.panX}px, ${viewSettings.panY}px) scale(${scale})`;

    const filterCss = getFilterCssString(viewSettings.filters);

    const commonStyle: React.CSSProperties = {
      transform,
      transition: isPanning ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
      filter: filterCss
    };

    switch (viewSettings.fitMode) {
      case 'contain':
        // Match the artwork's shape rather than the viewport's. A square
        // animation in a 16:9 box wastes ~45% of every rasterised frame on empty
        // background, and that cost is paid 60 times a second.
        return aspectRatio && aspectRatio > 0
          ? {
              width: `min(90vw, calc(85vh * ${aspectRatio.toFixed(4)}))`,
              aspectRatio: `${aspectRatio.toFixed(4)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...commonStyle
            }
          : {
              maxWidth: '90vw',
              maxHeight: '85vh',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...commonStyle
            };
      case 'cover':
        return {
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          ...commonStyle
        };
      case 'fill':
        return {
          width: '100%',
          height: '100%',
          ...commonStyle
        };
      case 'original':
      case 'custom':
      default:
        return {
          width: 'auto',
          height: 'auto',
          ...commonStyle
        };
    }
  };

  // Pan Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Enable pan on left click or middle click
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: viewSettings.panX, y: viewSettings.panY });
    }
  };

  // Trackpads emit mousemove faster than the screen refreshes, so commit at most
  // one pan update per frame instead of one state update per event.
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (panFrameRef.current !== null) return;
    panFrameRef.current = window.requestAnimationFrame(() => {
      panFrameRef.current = null;
      setViewSettings(prev => ({
        ...prev,
        panX: panStart.x + dx,
        panY: panStart.y + dy
      }));
    });
  };

  const handleMouseUp = () => {
    if (panFrameRef.current !== null) {
      window.cancelAnimationFrame(panFrameRef.current);
      panFrameRef.current = null;
    }
    setIsPanning(false);
  };

  useEffect(() => () => {
    if (panFrameRef.current !== null) window.cancelAnimationFrame(panFrameRef.current);
  }, []);

  // Double Click Reset View
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewSettings.zoom !== 1.0 || viewSettings.panX !== 0 || viewSettings.panY !== 0) {
      setViewSettings(prev => ({ ...prev, zoom: 1.0, panX: 0, panY: 0 }));
    } else {
      setViewSettings(prev => ({ ...prev, zoom: 2.0 }));
    }
  };

  const bgProps = getBackgroundStyle();

  return (
    <div
      ref={containerRef}
      onClick={onCanvasClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      } ${bgProps.className || ''}`}
      style={bgProps.style}
    >
      {/* Background Grid Mesh */}
      {viewSettings.showGrid && (
        <div className={`absolute inset-0 pointer-events-none ${
          viewSettings.background === 'solid-white' || viewSettings.background === 'checkerboard-light'
            ? 'bg-grid-pattern-light'
            : 'bg-grid-pattern'
        }`} />
      )}

      {/* Center Alignment Guides / Crosshairs */}
      {viewSettings.showCenterCrosshair && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="absolute w-full h-[1px] bg-indigo-500/30" />
          <div className="absolute h-full w-[1px] bg-indigo-500/30" />
          <div className="w-12 h-12 rounded-full border border-indigo-500/40 border-dashed" />
        </div>
      )}

      {/* Margins / Safe Guides */}
      {viewSettings.showGuides && (
        <div className="absolute inset-8 border border-indigo-400/20 rounded-xl pointer-events-none border-dashed">
          <span className="absolute top-2 left-3 text-[10px] font-mono text-indigo-400/50">SAFE AREA MARGIN</span>
        </div>
      )}

      {/* Player Container */}
      <div 
        style={getPlayerContainerStyle()} 
        className="relative flex items-center justify-center"
      >
        {src ? (
          <LottiePlayer
            src={src}
            loop={loop}
            autoplay={isPlaying}
            speed={speed}
            renderConfig={renderConfig}
            dotLottieRefCallback={handleDotLottieRef}
            onError={() => onLoadError('Không thể tải tệp Lottie từ nguồn này.')}
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : data ? (
          <LottiePlayer
            data={data}
            loop={loop}
            autoplay={isPlaying}
            speed={speed}
            renderConfig={renderConfig}
            dotLottieRefCallback={handleDotLottieRef}
            onError={() => onLoadError('Lỗi dữ liệu JSON Lottie không hợp lệ.')}
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <div className="text-center p-8 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl max-w-sm">
            <p className="text-sm font-semibold text-slate-300">Chưa có tệp Lottie nào được chọn</p>
            <p className="text-xs text-slate-500 mt-1">Kéo thả tệp .lottie hoặc .json vào bất kỳ đâu trên màn hình</p>
          </div>
        )}
      </div>

      {/* Canvas Controls Hint */}
      {viewSettings.controlsHidden && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-950/70 backdrop-blur-md border border-slate-800 rounded-full text-[11px] text-slate-400 animate-fade-in pointer-events-none">
          Nhấn <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-200 font-mono">H</kbd> để hiện thanh công cụ
        </div>
      )}
    </div>
  );
};

export const LottieCanvas = React.memo(LottieCanvasComponent);

