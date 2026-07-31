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

export function getRenderPixelRatio(
  layoutWidth: number,
  layoutHeight: number,
  zoom: number
): number {
  const nativeRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

  // Layout sizes are unaffected by the transform, so this is the on-screen size
  const visualWidth = Math.max(1, layoutWidth * zoom);
  const visualHeight = Math.max(1, layoutHeight * zoom);

  const dimensionLimit = Math.min(
    MAX_CANVAS_DIMENSION / visualWidth,
    MAX_CANVAS_DIMENSION / visualHeight
  );
  const areaLimit = Math.sqrt(MAX_CANVAS_PIXELS / (visualWidth * visualHeight));

  // The budget always wins over any preferred ratio: overshooting it means the
  // browser hands back a canvas it never allocated, i.e. nothing renders at all.
  const budgetRatio = Math.min(dimensionLimit, areaLimit);

  return Math.max(MIN_PIXEL_RATIO, Math.min(nativeRatio, budgetRatio));
}
