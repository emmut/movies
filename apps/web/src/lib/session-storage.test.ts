import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  readSessionStorageValue,
  removeSessionStorageValue,
  subscribeToSessionStorage,
  writeSessionStorageValue,
} from './session-storage';

function stubWindow(overrides: Partial<{ sessionStorage: unknown }> = {}) {
  const store = new Map<string, string>();

  const window = Object.assign(new EventTarget(), {
    sessionStorage: overrides.sessionStorage ?? {
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

describe('read/writeSessionStorageValue', () => {
  it('round-trips a value', () => {
    stubWindow();

    writeSessionStorageValue('key', 'value');

    expect(readSessionStorageValue('key')).toBe('value');
  });

  it('returns null for missing keys', () => {
    stubWindow();

    expect(readSessionStorageValue('missing')).toBeNull();
  });

  it('is a no-op on the server, where window is undefined', () => {
    expect(() => writeSessionStorageValue('key', 'value')).not.toThrow();
    expect(readSessionStorageValue('key')).toBeNull();
  });

  it('swallows storage errors (private mode, blocked cookies)', () => {
    stubWindow({
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

    expect(() => writeSessionStorageValue('key', 'value')).not.toThrow();
    expect(() => removeSessionStorageValue('key')).not.toThrow();
    expect(readSessionStorageValue('key')).toBeNull();
  });
});

describe('removeSessionStorageValue', () => {
  it('removes a stored value', () => {
    stubWindow();
    writeSessionStorageValue('key', 'value');

    removeSessionStorageValue('key');

    expect(readSessionStorageValue('key')).toBeNull();
  });

  it('is a no-op on the server', () => {
    expect(() => removeSessionStorageValue('key')).not.toThrow();
  });

  it('notifies subscribers after removal', () => {
    stubWindow();
    const onChange = vi.fn();
    subscribeToSessionStorage(onChange);
    writeSessionStorageValue('key', 'value');

    removeSessionStorageValue('key');

    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('subscribeToSessionStorage', () => {
  it('notifies subscribers on same-document writes', () => {
    stubWindow();
    const onChange = vi.fn();
    subscribeToSessionStorage(onChange);

    writeSessionStorageValue('key', 'value');

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers on the native storage event from other documents', () => {
    stubWindow();
    const onChange = vi.fn();
    subscribeToSessionStorage(onChange);

    window.dispatchEvent(new Event('storage'));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('stops notifying after unsubscribe', () => {
    stubWindow();
    const onChange = vi.fn();
    const unsubscribe = subscribeToSessionStorage(onChange);

    unsubscribe();
    writeSessionStorageValue('key', 'value');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not notify when the write itself failed', () => {
    stubWindow({
      sessionStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error('denied');
        },
      },
    });
    const onChange = vi.fn();
    subscribeToSessionStorage(onChange);

    writeSessionStorageValue('key', 'value');

    expect(onChange).not.toHaveBeenCalled();
  });
});
