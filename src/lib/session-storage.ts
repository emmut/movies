/**
 * `sessionStorage` as an external store for `useSyncExternalStore`.
 *
 * The native `storage` event only fires in *other* documents, so writes made
 * through {@link writeSessionStorageValue} also dispatch a same-document
 * event; {@link subscribeToSessionStorage} listens to both. All access is
 * guarded — on the server and when storage is unavailable (private mode,
 * blocked cookies) reads return `null` and writes are no-ops.
 */

const SESSION_STORAGE_EVENT = 'session-storage-change';

export function readSessionStorageValue(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSessionStorageValue(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    return;
  }

  window.dispatchEvent(new Event(SESSION_STORAGE_EVENT));
}

/** Subscribe to storage changes; returns the unsubscribe cleanup. */
export function subscribeToSessionStorage(onChange: () => void): () => void {
  window.addEventListener(SESSION_STORAGE_EVENT, onChange);
  window.addEventListener('storage', onChange);

  return function unsubscribe() {
    window.removeEventListener(SESSION_STORAGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}
