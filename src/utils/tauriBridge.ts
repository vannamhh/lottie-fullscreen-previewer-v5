/**
 * Bridge between the macOS shell and the existing web app.
 *
 * When the user double-clicks a `.lottie` file (or picks the app from "Open
 * With" on a `.json`), the Rust side reads the bytes and hands them over. We
 * rebuild a `File` here so the native path reuses `processFile` — the very same
 * function drag-and-drop and the file picker already go through.
 */

/** Payload shape emitted by the Rust `deliver`/`take_pending_files` pair. */
interface OpenedFilePayload {
  name: string;
  /** Base64, because `.lottie` is a zip and must survive the IPC bridge intact. */
  data: string;
}

const OPEN_FILE_EVENT = 'lottie://open-file';

/** True only inside the Tauri webview; the plain browser build skips everything. */
export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const MIME_BY_EXT: Record<string, string> = {
  lottie: 'application/zip',
  zip: 'application/zip',
  json: 'application/json',
};

function toFile({ name, data }: OpenedFilePayload): File {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return new File([bytes], name, { type: MIME_BY_EXT[ext] ?? 'application/octet-stream' });
}

/**
 * Wires up file opens coming from Finder. Returns a cleanup function.
 *
 * Two delivery paths exist because of a startup race: a cold launch hands us the
 * file before React has mounted, so Rust queues it and we drain the queue here;
 * once drained, Rust switches to emitting events for any further opens.
 */
export function listenForOpenedFiles(onFile: (file: File) => void): () => void {
  if (!isTauri()) return () => {};

  let unlisten: (() => void) | undefined;
  let cancelled = false;

  (async () => {
    const [{ invoke }, { listen }] = await Promise.all([
      import('@tauri-apps/api/core'),
      import('@tauri-apps/api/event'),
    ]);

    // Subscribe first, then drain: Rust only starts emitting after the drain
    // call flips its ready flag, so this ordering cannot drop a file.
    const stop = await listen<OpenedFilePayload>(OPEN_FILE_EVENT, (event) => {
      onFile(toFile(event.payload));
    });

    if (cancelled) {
      stop();
      return;
    }
    unlisten = stop;

    const pending = await invoke<OpenedFilePayload[]>('take_pending_files');
    for (const payload of pending) onFile(toFile(payload));
  })().catch((err) => {
    console.error('[tauri] failed to set up file-open bridge:', err);
  });

  return () => {
    cancelled = true;
    unlisten?.();
  };
}
