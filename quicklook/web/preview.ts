/**
 * The page that runs inside the Quick Look extensions' WKWebView.
 *
 * Serves two callers with one bundle:
 *   - preview mode   — plays the animation in the Quick Look panel
 *   - thumbnail mode — paints one representative frame, then reports that the
 *                      webview is ready to be snapshotted
 *
 * Everything has to work from a `file://` origin with no network and no
 * fetchable sibling files, so the WASM player is inlined at build time and the
 * animation bytes are injected by the Swift host before this script runs.
 */
import { DotLottie } from '@lottiefiles/dotlottie-web';
import wasmBase64 from 'virtual:dotlottie-wasm';

type Mode = 'preview' | 'thumbnail';

declare global {
  interface Window {
    /** Base64 of the .lottie file, set by the Swift host. */
    __LOTTIE_B64__?: string;
    __LOTTIE_NAME__?: string;
    __LOTTIE_MODE__?: Mode;
    webkit?: {
      messageHandlers?: Record<string, { postMessage(body: unknown): void }>;
    };
  }
}

/**
 * Where to freeze the animation for a thumbnail, as a fraction of its length.
 * Lottie files very often open on an empty stage, so frame 0 would give a blank
 * icon; a little past the middle is far more likely to be representative.
 */
const THUMBNAIL_POSITION = 0.4;

const mode: Mode = window.__LOTTIE_MODE__ === 'thumbnail' ? 'thumbnail' : 'preview';
document.documentElement.dataset.mode = mode;

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// A blob URL sidesteps the file:// origin entirely — fetching a relative path or
// a data: URI from here is unreliable inside the extension's webview.
DotLottie.setWasmUrl(
  URL.createObjectURL(new Blob([base64ToBytes(wasmBase64)], { type: 'application/wasm' })),
);

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const footer = document.getElementById('footer') as HTMLElement;
const errorBox = document.getElementById('error') as HTMLElement;

/** Tells the Swift host it may snapshot now. Safe to call more than once. */
let hostNotified = false;
function notifyHost(channel: 'ready' | 'failed'): void {
  if (mode !== 'thumbnail' || hostNotified) return;
  hostNotified = true;
  window.webkit?.messageHandlers?.thumbnail?.postMessage(channel);
}

function fail(message: string): void {
  errorBox.textContent = message;
  errorBox.hidden = false;
  canvas.hidden = true;
  footer.hidden = true;
  notifyHost('failed');
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Keep the backing store matched to the CSS box so the render stays crisp. */
function sizeCanvas(): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
}

function main(): void {
  const encoded = window.__LOTTIE_B64__;
  if (!encoded) {
    fail('Không nhận được dữ liệu animation.');
    return;
  }

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(encoded);
  } catch {
    fail('Dữ liệu tệp không hợp lệ.');
    return;
  }

  sizeCanvas();

  const player = new DotLottie({
    canvas,
    // The player detects .lottie (zip) vs raw JSON from the buffer itself.
    data: bytes.buffer as ArrayBuffer,
    autoplay: mode === 'preview',
    loop: mode === 'preview',
    backgroundColor: 'transparent',
  });

  player.addEventListener('load', () => {
    if (mode === 'thumbnail') {
      const target = Math.floor((player.totalFrames || 0) * THUMBNAIL_POSITION);
      player.setFrame(target);
      player.pause();
      return;
    }

    const parts = [window.__LOTTIE_NAME__ ?? '', formatBytes(bytes.length)];
    const duration = player.duration;
    if (duration) parts.push(`${duration.toFixed(2)}s`);
    footer.textContent = parts.filter(Boolean).join('  ·  ');
    footer.hidden = false;
  });

  // 'render' fires once the frame is actually on the canvas — snapshotting any
  // earlier would capture an empty surface.
  player.addEventListener('render', () => notifyHost('ready'));

  player.addEventListener('loadError', () => {
    fail('Không đọc được animation trong tệp này.');
  });

  // Quick Look panels get resized by the user; keep up with it.
  const observer = new ResizeObserver(() => {
    sizeCanvas();
    player.resize();
  });
  observer.observe(canvas);
}

main();
