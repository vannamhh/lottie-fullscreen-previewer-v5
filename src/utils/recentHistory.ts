export interface RecentFileItem {
  id: string;
  name: string;
  format: 'json' | 'dotlottie';
  sizeFormatted: string;
  sizeBytes: number;
  updatedAt: number;
  isFavorite?: boolean;
  url?: string;
  jsonData?: any;
  sampleId?: string;
}

const STORAGE_KEY = 'lottie_recent_files_v1';
const MAX_RECENT_ITEMS = 20;

/**
 * localStorage holds roughly 5 MB of UTF-16 characters per origin, and the cached
 * animations are the only thing here big enough to matter. Two 2.5 MB entries used
 * to fill the whole quota on their own: every later write threw, the catch block
 * swallowed it, and the history silently froze on whatever handful of files had
 * been saved first. The budget below keeps the payload well inside the quota so
 * that path is never reached.
 */
const MAX_JSON_STORE_BYTES = 700 * 1024;
const TOTAL_JSON_BUDGET_BYTES = 2 * 1024 * 1024;

const measure = (value: any): number => {
  try {
    return JSON.stringify(value).length;
  } catch {
    return Infinity;
  }
};

const withoutJson = (item: RecentFileItem): RecentFileItem => {
  const { jsonData, ...rest } = item;
  return rest;
};

/**
 * Keep the cached animations of the newest entries and drop the rest. Older items
 * stay in the list — they just reload from disk or URL instead of from the cache.
 */
function applyCacheBudget(items: RecentFileItem[]): RecentFileItem[] {
  let used = 0;
  return items.map(item => {
    if (!item.jsonData) return item;

    const size = measure(item.jsonData);
    if (size > MAX_JSON_STORE_BYTES || used + size > TOTAL_JSON_BUDGET_BYTES) {
      return withoutJson(item);
    }
    used += size;
    return item;
  });
}

function writeRaw(items: RecentFileItem[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

/**
 * Persist the list, degrading it step by step until it fits. Returns what actually
 * landed in storage so callers never show the UI a list the next reload will not
 * have.
 */
export function saveRecentFiles(items: RecentFileItem[]): RecentFileItem[] {
  const budgeted = applyCacheBudget(items);
  if (writeRaw(budgeted)) return budgeted;

  console.warn('LocalStorage full — trimming cached Lottie data from recent files');

  // Give up the cached animations before giving up any history entries.
  const lean = budgeted.map(withoutJson);
  if (writeRaw(lean)) return lean;

  // Still too big: drop the oldest entries, keeping favourites as long as possible.
  let remaining = lean;
  while (remaining.length > 1) {
    const dropIdx = remaining.reduce(
      (worst, item, idx) => {
        const current = remaining[worst];
        if (!!item.isFavorite !== !!current.isFavorite) return item.isFavorite ? worst : idx;
        return item.updatedAt < current.updatedAt ? idx : worst;
      },
      0
    );
    remaining = remaining.filter((_, idx) => idx !== dropIdx);
    if (writeRaw(remaining)) return remaining;
  }

  // Last resort: make room by discarding the old payload, then store the newest entry alone.
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  if (remaining.length && writeRaw(remaining)) return remaining;

  console.warn('Unable to persist recent files: storage is unavailable');
  return [];
}

export function getRecentFiles(): RecentFileItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed reading recent files from localStorage', err);
    return [];
  }
}

export function addRecentFile(
  fileData: Omit<RecentFileItem, 'id' | 'updatedAt'>
): RecentFileItem[] {
  const current = getRecentFiles();

  // Same entry means same source, not merely the same file name: 'animation.json'
  // on disk and a remote 'animation.json' are two different animations.
  const existingIdx = current.findIndex(item => {
    if (fileData.url || item.url) return item.url === fileData.url;
    return item.name === fileData.name && item.format === fileData.format;
  });

  let updatedItem: RecentFileItem;

  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    updatedItem = {
      ...existing,
      ...fileData,
      // Never inherit the previous entry's cached animation: without this, an
      // update that carries no jsonData would keep replaying the old one.
      jsonData: fileData.jsonData,
      updatedAt: Date.now(),
      isFavorite: existing.isFavorite
    };
    current.splice(existingIdx, 1);
  } else {
    updatedItem = {
      ...fileData,
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      updatedAt: Date.now()
    };
  }

  // Oversized animations still earn a history entry, just without the cached copy.
  if (updatedItem.jsonData && measure(updatedItem.jsonData) > MAX_JSON_STORE_BYTES) {
    updatedItem = withoutJson(updatedItem);
  }

  const newList = [updatedItem, ...current].slice(0, MAX_RECENT_ITEMS);
  return saveRecentFiles(newList);
}

export function toggleFavoriteRecentFile(id: string): RecentFileItem[] {
  const current = getRecentFiles();
  const updated = current.map(item => {
    if (item.id === id) {
      return { ...item, isFavorite: !item.isFavorite };
    }
    return item;
  });
  return saveRecentFiles(updated);
}

export function removeRecentFile(id: string): RecentFileItem[] {
  const current = getRecentFiles();
  const updated = current.filter(item => item.id !== id);
  return saveRecentFiles(updated);
}

export function clearRecentFiles(): RecentFileItem[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    // Ignore
  }
  return [];
}
