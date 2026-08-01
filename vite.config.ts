import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Tauri points its webview at this exact port, so failing loudly beats
        // silently drifting to 3001 and showing a blank window.
        strictPort: true,
      },
      // Keep Rust compiler errors on screen during `tauri dev`.
      clearScreen: false,
      build: {
        // Matches the WKWebView that ships with the minimum macOS we target.
        target: 'safari14',
        sourcemap: false,
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Vite would otherwise try to inline these as relative paths at build time.
      envPrefix: ['VITE_', 'TAURI_'],
    };
});
