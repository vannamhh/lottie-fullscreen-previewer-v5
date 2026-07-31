import React, { useState } from 'react';
import { X, Code2, Copy, Check, Terminal } from 'lucide-react';
import { LottieMetadata } from '../types';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: LottieMetadata | null;
  fileSourceUrl: string | null;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  metadata,
  fileSourceUrl
}) => {
  const [framework, setFramework] = useState<'react' | 'webcomponent' | 'reactnative' | 'html'>('react');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sourceStr = fileSourceUrl && !fileSourceUrl.startsWith('blob:') 
    ? fileSourceUrl 
    : metadata ? `./${metadata.fileName}` : './animation.lottie';

  const getCodeSnippet = (): string => {
    switch (framework) {
      case 'react':
        return `import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export const MyAnimation = () => {
  return (
    <div style={{ width: ${metadata?.width || 300}, height: ${metadata?.height || 300} }}>
      <DotLottieReact
        src="${sourceStr}"
        loop
        autoplay
        speed={1}
      />
    </div>
  );
};`;

      case 'webcomponent':
        return `<!-- Step 1: Add Script to <head> -->
<script src="https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs" type="module"></script>

<!-- Step 2: Use Player Tag in Body -->
<dotlottie-player
  src="${sourceStr}"
  background="transparent"
  speed="1"
  style="width: ${metadata?.width || 300}px; height: ${metadata?.height || 300}px"
  loop
  autoplay
></dotlottie-player>`;

      case 'reactnative':
        return `import React from 'react';
import LottieView from 'lottie-react-native';

export default function App() {
  return (
    <LottieView
      source={require('${sourceStr}')}
      autoPlay
      loop
      style={{ width: ${metadata?.width || 300}, height: ${metadata?.height || 300} }}
    />
  );
}`;

      case 'html':
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Lottie Animation</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
</head>
<body>
  <div id="lottie-container" style="width: 400px; height: 400px;"></div>

  <script>
    lottie.loadAnimation({
      container: document.getElementById('lottie-container'),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '${sourceStr}'
    });
  </script>
</body>
</html>`;

      default:
        return '';
    }
  };

  const code = getCodeSnippet();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Xuất Mã Nguồn Code Snippet</h2>
              <p className="text-xs text-slate-400">Dễ dàng nhúng animation vào ứng dụng Web & Mobile của bạn</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Framework Selector Tabs */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          <button
            onClick={() => setFramework('react')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              framework === 'react'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            React (dotlottie)
          </button>

          <button
            onClick={() => setFramework('webcomponent')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              framework === 'webcomponent'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Web Component
          </button>

          <button
            onClick={() => setFramework('reactnative')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              framework === 'reactnative'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            React Native
          </button>

          <button
            onClick={() => setFramework('html')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              framework === 'html'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Vanilla HTML / JS
          </button>
        </div>

        {/* Code Snippet Box */}
        <div className="p-5 space-y-4">
          <div className="relative group">
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-purple-300 overflow-x-auto leading-relaxed max-h-[300px]">
              <code>{code}</code>
            </pre>

            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã Sao Chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-400">
            <Terminal className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Cài đặt package bằng npm: <code className="text-slate-200 font-mono">npm i @lottiefiles/dotlottie-react</code>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
