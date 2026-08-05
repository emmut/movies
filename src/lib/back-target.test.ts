import { afterEach, describe, expect, it, vi } from 'vitest';

import { getBackTarget, saveBackTarget } from './back-target';

function stubWindow(overrides: { pathname?: string; search?: string } = {}) {
  const store = new Map<string, string>();

  vi.stubGlobal('window', {
    location: { pathname: overrides.pathname ?? '/search', search: overrides.search ?? '' },
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    },
  });

  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveBackTarget / getBackTarget', () => {
  it('round-trips the current URL, including query params', () => {
    stubWindow({ pathname: '/search', search: '?q=batman&page=2' });

    saveBackTarget('/movie/123');

    expect(getBackTarget('/movie/123')).toBe('/search?q=batman&page=2');
  });

  it('keeps a separate target per destination page', () => {
    stubWindow({ pathname: '/discover', search: '?genreId=28' });
    saveBackTarget('/movie/1');

    stubWindow({ pathname: '/search', search: '?q=alien' });
    saveBackTarget('/tv/2');

    expect(getBackTarget('/tv/2')).toBe('/search?q=alien');
  });

  it('overwrites the target on a later click, so the freshest origin wins', () => {
    const store = stubWindow({ pathname: '/search', search: '?q=first' });
    saveBackTarget('/movie/123');

    vi.stubGlobal('window', {
      location: { pathname: '/search', search: '?q=second' },
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
      },
    });
    saveBackTarget('/movie/123');

    expect(getBackTarget('/movie/123')).toBe('/search?q=second');
  });

  it('keys hrefs by pathname, ignoring query and hash', () => {
    stubWindow({ pathname: '/discover', search: '?genreId=12' });

    saveBackTarget('/movie/9?utm=x#top');

    expect(getBackTarget('/movie/9')).toBe('/discover?genreId=12');
  });

  it('returns null when nothing was recorded for the page', () => {
    stubWindow();

    expect(getBackTarget('/movie/404')).toBeNull();
  });

  it('rejects stored values that are not internal paths', () => {
    const store = stubWindow();
    store.set('back-target:/movie/1', 'https://evil.example');
    store.set('back-target:/movie/2', '//evil.example');

    expect(getBackTarget('/movie/1')).toBeNull();
    expect(getBackTarget('/movie/2')).toBeNull();
  });

  it('is a no-op on the server, where window is undefined', () => {
    expect(() => saveBackTarget('/movie/1')).not.toThrow();
    expect(getBackTarget('/movie/1')).toBeNull();
  });

  it('swallows storage errors (private mode, blocked cookies)', () => {
    vi.stubGlobal('window', {
      location: { pathname: '/search', search: '' },
      sessionStorage: {
        getItem: () => {
          throw new Error('denied');
        },
        setItem: () => {
          throw new Error('denied');
        },
      },
    });

    expect(() => saveBackTarget('/movie/1')).not.toThrow();
    expect(getBackTarget('/movie/1')).toBeNull();
  });
});
