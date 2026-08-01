import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

const WASM_SOURCE = path.resolve(
  __dirname,
  'node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm',
);
const VIRTUAL_ID = 'virtual:dotlottie-wasm';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * Bakes the player WASM into the bundle as base64.
 *
 * The preview runs from a `file://` origin inside the Quick Look extension,
 * where fetching a sibling `.wasm` is blocked. Inlining it at build time is the
 * one approach that needs no network, no custom scheme handler, and no
 * cross-origin exemption at runtime.
 */
function inlineDotLottieWasm(): Plugin {
  return {
    name: 'inline-dotlottie-wasm',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const base64 = fs.readFileSync(WASM_SOURCE).toString('base64');
      return `export default ${JSON.stringify(base64)};`;
    },
  };
}

/** Vite's library mode emits only JS, so the page itself is copied verbatim. */
function copyPreviewHtml(outDir: string): Plugin {
  return {
    name: 'copy-preview-html',
    closeBundle() {
      fs.copyFileSync(
        path.resolve(__dirname, 'quicklook/web/preview.html'),
        path.join(outDir, 'preview.html'),
      );
    },
  };
}

const OUT_DIR = path.resolve(__dirname, 'dist-quicklook');

export default defineConfig({
  plugins: [inlineDotLottieWasm(), copyPreviewHtml(OUT_DIR)],
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    // Matches the WKWebView on the minimum macOS the extension targets.
    target: 'safari14',
    lib: {
      entry: path.resolve(__dirname, 'quicklook/web/preview.ts'),
      name: 'LottieQuickLook',
      // IIFE, not ESM: a `type="module"` script is blocked at a file:// origin.
      formats: ['iife'],
      fileName: () => 'preview.js',
    },
    // The inlined WASM alone is ~2.4 MB of base64; the size warning is expected.
    chunkSizeWarningLimit: 4096,
  },
});
