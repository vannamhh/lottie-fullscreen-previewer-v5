/**
 * Zoom is applied as a CSS transform, which magnifies the already-rasterised
 * canvas and makes the animation go soft. The player sizes its backing store
 * from the canvas' bounding rect — which does include the transform — so asking
 * it to resize after a zoom re-rasterises the vectors at the magnified size and
 * it comes back razor sharp.
 *
 * What the player cannot judge is the pixel budget: at deep zoom the naive size
 * is a buffer the browser refuses to allocate, which leaves a blank canvas. This
 * picks the highest pixel ratio that still fits.
 */
const MAX_CANVAS_DIMENSION = 8192;
const MAX_CANVAS_PIXELS = 16.7e6; // iOS Safari refuses canvases past ~16.7M pixels
const MIN_PIXEL_RATIO = 0.05; // only guards against a degenerate zero-sized target

/**
 * Playback budget. Measured on this app: render cost is linear in pixel count,
 * and a fullscreen canvas on a retina display lands at ~4.5M pixels a frame,
 * which drops a busy animation to single-digit fps — on the GPU renderer too.
 * ~2M keeps typical animations at 60fps; the full budget above is restored the
 * moment playback stops, so a paused or zoomed frame is still pixel-perfect.
 */
const PLAYBACK_MAX_PIXELS = 2.1e6;

export interface RenderQualityOptions {
  /** While frames are being drawn, cap pixels for smoothness over sharpness */
  isPlaying?: boolean;
}

export function getRenderPixelRatio(
  layoutWidth: number,
  layoutHeight: number,
  zoom: number,
  options: RenderQualityOptions = {}
): number {
  const nativeRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const pixelBudget = options.isPlaying ? PLAYBACK_MAX_PIXELS : MAX_CANVAS_PIXELS;

  // Layout sizes are unaffected by the transform, so this is the on-screen size
  const visualWidth = Math.max(1, layoutWidth * zoom);
  const visualHeight = Math.max(1, layoutHeight * zoom);

  const dimensionLimit = Math.min(
    MAX_CANVAS_DIMENSION / visualWidth,
    MAX_CANVAS_DIMENSION / visualHeight
  );
  const areaLimit = Math.sqrt(pixelBudget / (visualWidth * visualHeight));

  // The budget always wins over any preferred ratio: overshooting it means the
  // browser hands back a canvas it never allocated, i.e. nothing renders at all.
  const budgetRatio = Math.min(dimensionLimit, areaLimit);

  return Math.max(MIN_PIXEL_RATIO, Math.min(nativeRatio, budgetRatio));
}
