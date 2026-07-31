import JSZip from 'jszip';
import { optimizeLottieJson, LottieOptimizeOptions } from './lottieOptimizer';

export interface ConvertOptions {
  author?: string;
  speed?: number;
  loop?: boolean;
  autoplay?: boolean;
  animationId?: string;
  optimize?: boolean;
  optimizeOptions?: LottieOptimizeOptions;
}

/**
 * Converts a Lottie JSON object (or string) into a .lottie (DotLottie) zip Blob.
 */
export async function convertJsonToDotLottie(
  jsonObject: any,
  options: ConvertOptions = {}
): Promise<{ blob: Blob; size: number; compressedPercent: number; rawJsonSize: number }> {
  const zip = new JSZip();

  let targetJson = jsonObject;
  let rawJsonSize = 0;

  if (typeof jsonObject === 'string') {
    try {
      targetJson = JSON.parse(jsonObject);
    } catch {
      targetJson = jsonObject;
    }
  }

  rawJsonSize = new Blob([JSON.stringify(targetJson)]).size;

  if (options.optimize) {
    const optResult = optimizeLottieJson(targetJson, options.optimizeOptions);
    targetJson = optResult.optimizedJson;
  }

  const animId = options.animationId || 'animation';
  const manifest = {
    generator: 'Lottie Fullscreen Converter',
    version: '1.0',
    author: options.author || 'User',
    animations: [
      {
        id: animId,
        speed: options.speed ?? 1,
        loop: options.loop ?? true,
        autoplay: options.autoplay ?? true
      }
    ]
  };

  // 1. Add manifest.json
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Add animation json
  const jsonString = typeof targetJson === 'string' ? targetJson : JSON.stringify(targetJson);
  zip.file(`animations/${animId}.json`, jsonString);

  // Generate ZIP blob with maximum compression level 9
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/x-dotlottie',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const compressedSize = zipBlob.size;
  const compressedPercent = Math.max(0, Math.round(((rawJsonSize - compressedSize) / rawJsonSize) * 100));

  return {
    blob: zipBlob,
    size: compressedSize,
    compressedPercent,
    rawJsonSize
  };
}

/**
 * Trigger browser file download for a given Blob.
 */
export function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
