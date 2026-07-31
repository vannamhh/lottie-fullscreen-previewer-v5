/**
 * Floor applied to normalized (0..1) numbers regardless of the requested
 * precision — colors, opacity fractions and bezier easing handles live in this
 * range and become visibly wrong below ~3 decimals.
 */
const NORMALIZED_MIN_PRECISION = 3;

export interface LottieOptimizeOptions {
  /** Round decimal coordinates to N decimal places (default: 2). Normalized 0..1 values keep at least 3. */
  roundPrecision?: number;
  /** Strip layer/shape names ('nm' property) */
  stripNames?: boolean;
  /** Strip hidden shapes and layers ('hd': true), except layers still referenced as a parent or matte */
  stripHidden?: boolean;
  /** Strip Bodymovin match names ('mn') and the generator tag. Markers are kept — they drive segment playback. */
  stripMetadata?: boolean;
  /** Minify JSON output (remove indentation) */
  minify?: boolean;
}

export interface OptimizationResult {
  optimizedJson: any;
  jsonString: string;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercent: number;
}

/**
 * Deeply processes a Lottie JSON object to remove unneeded properties
 * and round high-precision floating numbers.
 */
export function optimizeLottieJson(
  rawJson: any,
  options: LottieOptimizeOptions = {}
): OptimizationResult {
  const {
    roundPrecision = 2,
    stripNames = true,
    stripHidden = true,
    stripMetadata = true,
    minify = true
  } = options;

  const originalStr = JSON.stringify(rawJson);
  const originalSize = new Blob([originalStr]).size;

  // Clone JSON object to prevent mutating original
  const jsonCopy = JSON.parse(originalStr);

  const factor = Math.pow(10, roundPrecision);
  // Values below 1 are normalized data (color channels, opacity fractions, bezier
  // easing handles), not pixel coordinates. Rounding them to the coordinate
  // precision flattens the palette to primaries and turns every ease into a step.
  const normalizedFactor = Math.pow(10, Math.max(roundPrecision, NORMALIZED_MIN_PRECISION));

  function roundValue(val: number): number {
    if (typeof val !== 'number' || !isFinite(val)) return val;
    // Don't round integers or very small integer-like floats
    if (Number.isInteger(val)) return val;
    const f = Math.abs(val) < 1 ? normalizedFactor : factor;
    return Math.round(val * f) / f;
  }

  /**
   * Layers that other layers point at must survive stripping, otherwise the
   * dangling reference silently breaks the transform hierarchy or the matte.
   */
  function collectReferencedLayerIndices(layers: any[]): Set<number> {
    const referenced = new Set<number>();

    layers.forEach((layer, i) => {
      if (!layer || typeof layer !== 'object') return;

      // Parenting: child.parent holds the parent layer's 'ind'.
      if (typeof layer.parent === 'number') {
        referenced.add(layer.parent);
      }

      // Track mattes consume the layer directly above them in the stack.
      if (layer.tt !== undefined) {
        const matte = layers[i - 1];
        if (matte && typeof matte === 'object' && typeof matte.ind === 'number') {
          referenced.add(matte.ind);
        }
      }
    });

    return referenced;
  }

  function processNode(node: any, parentKey?: string): any {
    if (node === null || node === undefined) return node;

    if (typeof node === 'number') {
      return roundValue(node);
    }

    if (Array.isArray(node)) {
      // Assets are addressed by 'refId', so entries can never be dropped by position.
      const canStrip = stripHidden && parentKey !== 'assets';
      const referencedInds =
        canStrip && parentKey === 'layers' ? collectReferencedLayerIndices(node) : null;

      const newArr: any[] = [];
      for (const item of node) {
        if (canStrip && item && typeof item === 'object' && item.hd === true) {
          const isReferenced =
            referencedInds !== null &&
            typeof item.ind === 'number' &&
            referencedInds.has(item.ind);

          if (!isReferenced) continue; // Skip hidden element
        }
        newArr.push(processNode(item, parentKey));
      }
      return newArr;
    }

    if (typeof node === 'object') {
      const newNode: Record<string, any> = {};

      for (const key of Object.keys(node)) {
        // Strip names ('nm') if requested
        if (stripNames && key === 'nm') {
          continue;
        }

        // Strip match names ('mn') or extra metadata if requested.
        // 'markers' stays: players use it for named-segment playback, so it is a
        // feature of the animation rather than After Effects leftovers.
        if (stripMetadata && (key === 'mn' || key === 'generator')) {
          continue;
        }

        const value = node[key];

        // Process children
        const processedVal = processNode(value, key);

        if (processedVal !== undefined) {
          newNode[key] = processedVal;
        }
      }

      return newNode;
    }

    return node;
  }

  // Top-level cleanup
  const optimizedObj = processNode(jsonCopy);

  // If top-level metadata removal requested
  if (stripMetadata && typeof optimizedObj === 'object' && optimizedObj !== null) {
    delete optimizedObj.generator;
  }

  const jsonString = minify
    ? JSON.stringify(optimizedObj)
    : JSON.stringify(optimizedObj, null, 2);

  const optimizedSize = new Blob([jsonString]).size;
  const savedBytes = Math.max(0, originalSize - optimizedSize);
  const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

  return {
    optimizedJson: optimizedObj,
    jsonString,
    originalSize,
    optimizedSize,
    savedBytes,
    savedPercent
  };
}
