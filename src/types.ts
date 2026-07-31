export type BackgroundType = 
  | 'checkerboard-dark'
  | 'checkerboard-light'
  | 'solid-dark'
  | 'solid-white'
  | 'solid-black'
  | 'gradient-purple'
  | 'gradient-sunset'
  | 'gradient-cyber'
  | 'custom';

export type CanvasFitMode = 'contain' | 'cover' | 'fill' | 'original' | 'custom';

export type PlaybackMode = 'normal' | 'bounce' | 'reverse';

export interface LottieMetadata {
  fileName: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  format: 'dotlottie' | 'json';
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  durationSeconds: number;
  generator?: string;
  version?: string;
  layerCount: number;
  assetCount: number;
  colors: string[];
  extractedAssets: Array<{
    id: string;
    width?: number;
    height?: number;
    fileName?: string;
    dataUrl?: string;
    sizeFormatted?: string;
  }>;
  layers: Array<{
    id: string;
    name: string;
    type: string;
    ind?: number;
  }>;
}

export interface SampleLottie {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  author: string;
  thumbBg?: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
  mode: PlaybackMode;
}

export interface CssFilterSettings {
  brightness: number; // 0-200%
  contrast: number;   // 0-200%
  saturate: number;   // 0-300%
  hueRotate: number;  // 0-360deg
  blur: number;       // 0-20px
  grayscale: number;  // 0-100%
  sepia: number;      // 0-100%
  invert: number;     // 0-100%
  dropShadow: boolean;
  shadowColor: string;
  preset: string;
}

export interface ViewSettings {
  background: BackgroundType;
  customBgColor: string;
  fitMode: CanvasFitMode;
  zoom: number; // 0.1 to 5.0
  panX: number;
  panY: number;
  showGrid: boolean;
  showGuides: boolean;
  showRulers: boolean;
  showCenterCrosshair: boolean;
  controlsHidden: boolean;
  filters: CssFilterSettings;
}
