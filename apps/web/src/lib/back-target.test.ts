import { afterEach, describe, expect, it, vi } from 'vitest';

import { backTargetKey, sanitizeBackHref, saveBackTarget } from './back-target';
import { readSessionStorageValue } from './session-storage';

function stubWindow(location: { pathname: string; search: string }) {
  const store = new Map<string, string>();

  vi.stubGlobal(
    'window',
    Object.assign(new EventTarget(), {
      location,
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
      },
    }),
  );
}

function storedTargetFor(pathname: string) {
  return sanitizeBackHref(readSessionStorageValue(backTargetKey(pathname)));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveBackTarget', () => {
  it('records the current URL, including query params, keyed by destination', () => {
    stubWindow({ pathname: '/search', search: '?q=batman&page=2' });

    saveBackTarget('/movie/123');

    expect(storedTargetFor('/movie/123')).toBe('/search?q=batman&page=2');
    expect(storedTargetFor('/movie/456')).toBeNull();
  });

  it('records an explicit target when given one (quick-search palette)', () => {
    stubWindow({ pathname: '/movie/603', search: '' });

    saveBackTarget('/tv/1396', '/search?q=the%20wire&mediaType=all');

    expect(storedTargetFor('/tv/1396')).toBe('/search?q=the%20wire&mediaType=all');
  });

  it('overwrites on a later click, so the freshest origin wins', () => {
    stubWindow({ pathname: '/search', search: '?q=first' });
    saveBackTarget('/movie/123');

    window.location.search = '?q=second';
    saveBackTarget('/movie/123');

    expect(storedTargetFor('/movie/123')).toBe('/search?q=second');
  });

  it('keys hrefs by pathname, ignoring query and hash', () => {
    stubWindow({ pathname: '/discover/28', search: '?watchProvider=8' });

    saveBackTarget('/movie/9?utm=x#top');

    expect(storedTargetFor('/movie/9')).toBe('/discover/28?watchProvider=8');
  });

  it('is a no-op on the server, where window is undefined', () => {
    expect(() => saveBackTarget('/movie/1')).not.toThrow();
  });
});

describe('sanitizeBackHref', () => {
  it('accepts known in-app paths with their query intact', () => {
    expect(sanitizeBackHref('/search?q=batman&mediaType=all')).toBe('/search?q=batman&mediaType=all');
    expect(sanitizeBackHref('/discover/28?watchProvider=8')).toBe('/discover/28?watchProvider=8');
    expect(sanitizeBackHref('/watchlist?mediaType=tv')).toBe('/watchlist?mediaType=tv');
    expect(sanitizeBackHref('/watched')).toBe('/watched');
    expect(sanitizeBackHref('/lists/abc123')).toBe('/lists/abc123');
    expect(sanitizeBackHref('/movie/603')).toBe('/movie/603');
    expect(sanitizeBackHref('/tv/1396')).toBe('/tv/1396');
    expect(sanitizeBackHref('/person/6384')).toBe('/person/6384');
    expect(sanitizeBackHref('/')).toBe('/');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(sanitizeBackHref('https://evil.example/search?q=x')).toBeNull();
    expect(sanitizeBackHref('//evil.example/search')).toBeNull();
  });

  it('rejects backslash authority smuggling and origin escapes', () => {
    // The URL parser treats `\` like `/`: these parse with an external
    // authority (and the second one with a protocol-relative pathname) even
    // though they start with a single slash.
    expect(sanitizeBackHref('/\\evil.example')).toBeNull();
    expect(sanitizeBackHref('/\\a//evil.example')).toBeNull();
    expect(sanitizeBackHref('/\\/evil.example')).toBeNull();
  });

  it('rejects unknown routes and non-string values', () => {
    expect(sanitizeBackHref('/login')).toBeNull();
    expect(sanitizeBackHref('/settings')).toBeNull();
    expect(sanitizeBackHref('/api/auth/callback/discord')).toBeNull();
    expect(sanitizeBackHref(undefined)).toBeNull();
    expect(sanitizeBackHref(null)).toBeNull();
    expect(sanitizeBackHref(['/search?q=a', '/search?q=b'])).toBeNull();
    expect(sanitizeBackHref('')).toBeNull();
    expect(sanitizeBackHref('search?q=x')).toBeNull();
  });
});
