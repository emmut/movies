import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearPendingGreet, hasPendingGreet, markPendingGreet } from '@/lib/pending-greet';

function stubWindow() {
  const store = new Map<string, string>();

  const window = Object.assign(new EventTarget(), {
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  });

  vi.stubGlobal('window', window);

  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pending greet', () => {
  it('is false by default', () => {
    stubWindow();

    expect(hasPendingGreet()).toBe(false);
  });

  it('is true after mark, false after clear', () => {
    stubWindow();

    markPendingGreet();
    expect(hasPendingGreet()).toBe(true);

    clearPendingGreet();
    expect(hasPendingGreet()).toBe(false);
  });

  it('is false on the server, where window is undefined', () => {
    expect(hasPendingGreet()).toBe(false);
    expect(() => markPendingGreet()).not.toThrow();
    expect(() => clearPendingGreet()).not.toThrow();
  });

  it('is false and write-safe when storage is unavailable', () => {
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: () => {
          throw new Error('denied');
        },
        setItem: () => {
          throw new Error('denied');
        },
        removeItem: () => {
          throw new Error('denied');
        },
      },
    });

    expect(hasPendingGreet()).toBe(false);
    expect(() => markPendingGreet()).not.toThrow();
    expect(() => clearPendingGreet()).not.toThrow();
  });
});
