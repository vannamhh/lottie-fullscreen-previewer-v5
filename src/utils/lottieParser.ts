import JSZip from 'jszip';
import { LottieMetadata } from '../types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Path portion of a URL, without query string or hash — '…/anim.json?token=x'
 * must still be recognised as JSON.
 */
function getUrlPath(url: string): string {
  try {
    return new URL(url, window.location.href).pathname;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

export function getUrlFileName(url: string, fallback = 'remote.json'): string {
  const name = getUrlPath(url).split('/').filter(Boolean).pop();
  return name ? decodeURIComponent(name) : fallback;
}

/** True for .lottie / .zip archives, ignoring any query string. */
export function isDotLottieUrl(url: string): boolean {
  return /\.(lottie|zip)$/i.test(getUrlPath(url));
}

/** True for plain Lottie JSON, ignoring any query string. */
export function isJsonUrl(url: string): boolean {
  return /\.json$/i.test(getUrlPath(url));
}

// Convert Lottie color array [r, g, b, a] (0-1 values) or hex to #RRGGBB
function lottieColorToHex(colorArr: number[]): string | null {
  if (!Array.isArray(colorArr) || colorArr.length < 3) return null;
  
  const r = Math.round((colorArr[0] > 1 ? colorArr[0] / 255 : colorArr[0]) * 255);
  const g = Math.round((colorArr[1] > 1 ? colorArr[1] / 255 : colorArr[1]) * 255);
  const b = Math.round((colorArr[2] > 1 ? colorArr[2] / 255 : colorArr[2]) * 255);

  const toHex = (c: number) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Recursively search object for colors
function extractColorsFromObject(obj: any, colorsSet: Set<string>) {
  if (!obj || typeof obj !== 'object') return;

  // Check for Fill (ty === 'fl') or Stroke (ty === 'st') or Solid Color (cl property)
  if (obj.ty === 'fl' || obj.ty === 'st' || obj.ty === 'gf' || obj.ty === 'gs') {
    if (obj.c && obj.c.k) {
      if (Array.isArray(obj.c.k) && typeof obj.c.k[0] === 'number') {
        const hex = lottieColorToHex(obj.c.k);
        if (hex) colorsSet.add(hex);
      } else if (Array.isArray(obj.c.k)) {
        // Keyframed color
        obj.c.k.forEach((kf: any) => {
          if (kf && kf.s && Array.isArray(kf.s)) {
            const hex = lottieColorToHex(kf.s);
            if (hex) colorsSet.add(hex);
          }
        });
      }
    }
  }

  // Solid Layer Color (sc)
  if (obj.sc && typeof obj.sc === 'string') {
    colorsSet.add(obj.sc.toUpperCase());
  }

  // Recurse children
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      extractColorsFromObject(obj[key], colorsSet);
    }
  }
}

// Map layer type numbers to human readable names
function getLayerTypeName(ty: number): string {
  switch (ty) {
    case 0: return 'Precomp Layer';
    case 1: return 'Solid Layer';
    case 2: return 'Image Asset';
    case 3: return 'Null Object';
    case 4: return 'Shape Layer';
    case 5: return 'Text Layer';
    case 6: return 'Audio Layer';
    case 13: return 'Camera Layer';
    default: return 'Layer';
  }
}

// Parse Lottie JSON object
export function parseLottieJsonObject(
  json: any,
  fileName: string,
  fileSizeBytes: number,
  format: 'dotlottie' | 'json',
  extraAssets: LottieMetadata['extractedAssets'] = []
): LottieMetadata {
  const width = json.w || 512;
  const height = json.h || 512;
  const fps = json.fr || 60;
  const ip = json.ip || 0;
  const op = json.op || 180;
  const totalFrames = Math.max(1, Math.round(op - ip));
  const durationSeconds = Number((totalFrames / fps).toFixed(2));
  const generator = json.v ? `Bodymovin ${json.v}` : (json.generator || 'Lottie');

  const layersList = Array.isArray(json.layers) ? json.layers : [];
  const layerCount = layersList.length;

  const parsedLayers = layersList.map((lyr: any, idx: number) => ({
    id: lyr.ind ? String(lyr.ind) : `layer-${idx}`,
    name: lyr.nm || `Layer ${idx + 1}`,
    type: getLayerTypeName(lyr.ty),
    ind: lyr.ind
  }));

  // Assets embedded in JSON
  const assetsList = Array.isArray(json.assets) ? json.assets : [];
  const assetCount = assetsList.length + extraAssets.length;

  const embeddedAssets = assetsList
    .filter((ast: any) => ast.p || ast.e)
    .map((ast: any, idx: number) => {
      let dataUrl = '';
      if (ast.p && ast.p.startsWith('data:image')) {
        dataUrl = ast.p;
      } else if (ast.u && ast.p) {
        dataUrl = `${ast.u}${ast.p}`;
      }
      return {
        id: ast.id || `asset-${idx}`,
        width: ast.w,
        height: ast.h,
        fileName: ast.p || `asset_${idx}.png`,
        dataUrl,
        sizeFormatted: 'Embedded'
      };
    });

  const allAssets = [...embeddedAssets, ...extraAssets];

  // Colors
  const colorsSet = new Set<string>();
  extractColorsFromObject(json, colorsSet);

  return {
    fileName,
    fileSizeFormatted: formatBytes(fileSizeBytes),
    fileSizeBytes,
    format,
    width,
    height,
    fps,
    totalFrames,
    durationSeconds,
    generator,
    version: json.v || '1.0',
    layerCount,
    assetCount,
    colors: Array.from(colorsSet).slice(0, 24),
    extractedAssets: allAssets,
    layers: parsedLayers
  };
}

/**
 * Parse a DotLottie .lottie ZIP file.
 *
 * The caller owns playback: it decides whether an object URL is needed and is
 * responsible for revoking it, so nothing is leaked when parsing fails or when
 * the archive was fetched from a URL that can be played directly.
 */
export async function parseDotLottieFile(file: File): Promise<{
  metadata: LottieMetadata;
  animationJson: any;
}> {
  const zip = new JSZip();

  try {
    const zipContent = await zip.loadAsync(file);
    
    // Look for manifest.json
    let manifest: any = null;
    const manifestFile = zipContent.file('manifest.json');
    if (manifestFile) {
      const manifestStr = await manifestFile.async('string');
      try { manifest = JSON.parse(manifestStr); } catch (_) {}
    }

    // Find main animation json file inside zip
    let animationJsonFile = zipContent.file('animations/data.json');
    if (!animationJsonFile) {
      // Look for any json in animations/ directory
      const animFiles = Object.keys(zipContent.files).filter(f => f.startsWith('animations/') && f.endsWith('.json'));
      if (animFiles.length > 0) {
        animationJsonFile = zipContent.file(animFiles[0]);
      }
    }

    if (!animationJsonFile) {
      // Search root for any .json file
      const anyJson = Object.keys(zipContent.files).find(f => f.endsWith('.json') && !f.includes('manifest'));
      if (anyJson) {
        animationJsonFile = zipContent.file(anyJson);
      }
    }

    let animationJson: any = null;
    if (animationJsonFile) {
      const jsonStr = await animationJsonFile.async('string');
      animationJson = JSON.parse(jsonStr);
    } else {
      throw new Error('No valid animation JSON found inside .lottie archive.');
    }

    // Extract images inside zip. Non-fatal: a broken asset still leaves a playable animation.
    const extractedAssets: LottieMetadata['extractedAssets'] = [];
    const imageFiles = Object.keys(zipContent.files).filter(f =>
      f.startsWith('images/') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp')
    );

    for (const imgPath of imageFiles) {
      const imgZipFile = zipContent.file(imgPath);
      if (imgZipFile && !imgZipFile.dir) {
        try {
          const base64 = await imgZipFile.async('base64');
          const ext = imgPath.split('.').pop()?.toLowerCase() || 'png';
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
          const dataUrl = `data:${mime};base64,${base64}`;

          extractedAssets.push({
            id: imgPath,
            fileName: imgPath.split('/').pop() || imgPath,
            dataUrl,
            sizeFormatted: formatBytes(base64.length * 0.75)
          });
        } catch (assetErr) {
          console.warn(`Skipping unreadable asset "${imgPath}" inside .lottie archive:`, assetErr);
        }
      }
    }

    const metadata = parseLottieJsonObject(
      animationJson,
      file.name,
      file.size,
      'dotlottie',
      extractedAssets
    );

    if (manifest && manifest.generator) {
      metadata.generator = manifest.generator;
    }

    return { metadata, animationJson };
  } catch (err) {
    // Never fall back to placeholder metadata: a resolved promise would render a
    // blank canvas next to an Inspector reporting dimensions no file ever had.
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`Tệp không phải là kho lưu trữ .lottie hợp lệ (${reason})`);
  }
}
