/**
 * In-app notices, replacing window.alert().
 *
 * The macOS webview Tauri embeds (wry's WKWebView) installs no handler for
 * JavaScript dialogs, so alert() draws nothing and confirm() silently answers
 * false. Every error reported through them was invisible inside the packaged app.
 */

export type NoticeTone = 'error' | 'info' | 'success';

export interface Notice {
  id: number;
  message: string;
  tone: NoticeTone;
}

const DISMISS_AFTER_MS = 6000;

let notices: Notice[] = [];
let nextId = 1;
const listeners = new Set<(notices: Notice[]) => void>();

const emit = () => {
  for (const listener of listeners) listener(notices);
};

export function dismissNotice(id: number): void {
  notices = notices.filter(notice => notice.id !== id);
  emit();
}

export function notify(message: string, tone: NoticeTone = 'error'): number {
  const id = nextId++;
  // Cap the stack so a loop of failures cannot bury the canvas.
  notices = [...notices, { id, message, tone }].slice(-4);
  emit();
  window.setTimeout(() => dismissNotice(id), DISMISS_AFTER_MS);
  return id;
}

export function subscribeToNotices(listener: (notices: Notice[]) => void): () => void {
  listeners.add(listener);
  listener(notices);
  return () => {
    listeners.delete(listener);
  };
}
