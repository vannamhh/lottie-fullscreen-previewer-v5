import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react';
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url';

/**
 * Serve the player's WebAssembly from our own bundle.
 *
 * By default the library fetches ~1.9MB from jsdelivr on every cold start, so
 * the first animation waits on a third-party CDN and the app cannot run offline
 * at all. Vite emits the file as a normal asset instead.
 *
 * A WebGL2 build also ships with the package. It was measured against this app
 * and came out SLOWER on integrated graphics — 5.4fps vs 13.6fps on a 30-layer
 * animation — because per-frame uploads cost more than the GPU saves at these
 * canvas sizes. It is deliberately not used; re-measure before reconsidering.
 */
setWasmUrl(wasmUrl);

export const LottiePlayer = DotLottieReact;
