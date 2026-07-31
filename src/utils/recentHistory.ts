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
const MAX_JSON_STORE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB max for direct JSON caching

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

export function saveRecentFiles(items: RecentFileItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('LocalStorage full, trimming older items', err);
    // If quota exceeded, strip heavy jsonData from non-favorite older items and try again
    const lightweight = items.map((item, idx) => {
      if (idx > 3 && !item.isFavorite) {
        const { jsonData, ...rest } = item;
        return rest;
      }
      return item;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      // Ignore final fallback
    }
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

  // Prevent giant JSON objects from clogging localStorage
  if (updatedItem.jsonData) {
    const jsonStr = JSON.stringify(updatedItem.jsonData);
    if (jsonStr.length > MAX_JSON_STORE_BYTES) {
      delete updatedItem.jsonData;
    }
  }

  const newList = [updatedItem, ...current].slice(0, MAX_RECENT_ITEMS);
  saveRecentFiles(newList);
  return newList;
}

export function toggleFavoriteRecentFile(id: string): RecentFileItem[] {
  const current = getRecentFiles();
  const updated = current.map(item => {
    if (item.id === id) {
      return { ...item, isFavorite: !item.isFavorite };
    }
    return item;
  });
  saveRecentFiles(updated);
  return updated;
}

export function removeRecentFile(id: string): RecentFileItem[] {
  const current = getRecentFiles();
  const updated = current.filter(item => item.id !== id);
  saveRecentFiles(updated);
  return updated;
}

export function clearRecentFiles(): RecentFileItem[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    // Ignore
  }
  return [];
}
