import { describe, expect, it } from 'vitest';

import { getBackHref, sanitizeBackHref, withBackHref } from './back-href';

const HOST = 'movies.example.com';
const HOSTS = [HOST, null];

function referer(path: string) {
  return `https://${HOST}${path}`;
}

describe('getBackHref', () => {
  it('goes back to search with the query intact', () => {
    expect(getBackHref(referer('/search?q=batman&mediaType=movie&page=2'), HOSTS)).toBe(
      '/search?q=batman&mediaType=movie&page=2',
    );
  });

  it('preserves encoded and multi-word search params verbatim', () => {
    expect(getBackHref(referer('/search?q=the%20dark%20knight&mediaType=all'), HOSTS)).toBe(
      '/search?q=the%20dark%20knight&mediaType=all',
    );
  });

  it('goes back to discover with genre path and filters intact', () => {
    expect(getBackHref(referer('/discover/28?watchProvider=8&page=3'), HOSTS)).toBe(
      '/discover/28?watchProvider=8&page=3',
    );
  });

  it('goes back to home and other list pages', () => {
    expect(getBackHref(referer('/'), HOSTS)).toBe('/');
    expect(getBackHref(referer('/watchlist?mediaType=tv'), HOSTS)).toBe('/watchlist?mediaType=tv');
    expect(getBackHref(referer('/watched'), HOSTS)).toBe('/watched');
    expect(getBackHref(referer('/lists/abc123'), HOSTS)).toBe('/lists/abc123');
  });

  it('goes back to a detail page for cast/recommendation navigation', () => {
    expect(getBackHref(referer('/movie/603'), HOSTS)).toBe('/movie/603');
    expect(getBackHref(referer('/tv/1396'), HOSTS)).toBe('/tv/1396');
    expect(getBackHref(referer('/person/6384'), HOSTS)).toBe('/person/6384');
  });

  it('matches the forwarded host when a proxy rewrites the host header', () => {
    expect(getBackHref(referer('/search?q=batman'), ['internal.railway.app', HOST])).toBe(
      '/search?q=batman',
    );
  });

  it('defaults to discover when there is no referer', () => {
    expect(getBackHref(null, HOSTS)).toBe('/discover');
    expect(getBackHref('', HOSTS)).toBe('/discover');
  });

  it('defaults to discover for login and unknown routes', () => {
    expect(getBackHref(referer('/login'), HOSTS)).toBe('/discover');
    expect(getBackHref(referer('/api/auth/callback/discord'), HOSTS)).toBe('/discover');
    expect(getBackHref(referer('/settings'), HOSTS)).toBe('/discover');
  });

  it('defaults to discover for referers from another host', () => {
    expect(getBackHref('https://evil.example/search?q=x', HOSTS)).toBe('/discover');
    expect(getBackHref(referer('/search?q=x'), ['other.example.com', null])).toBe('/discover');
  });

  it('defaults to discover when no host headers are present', () => {
    expect(getBackHref(referer('/search?q=x'), [null, null])).toBe('/discover');
  });

  it('defaults to discover for malformed referers', () => {
    expect(getBackHref('not a url', HOSTS)).toBe('/discover');
  });
});

describe('sanitizeBackHref', () => {
  it('accepts known in-app paths with their query intact', () => {
    expect(sanitizeBackHref('/search?q=batman&mediaType=all')).toBe('/search?q=batman&mediaType=all');
    expect(sanitizeBackHref('/discover/28?watchProvider=8')).toBe('/discover/28?watchProvider=8');
    expect(sanitizeBackHref('/movie/603')).toBe('/movie/603');
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
    expect(sanitizeBackHref(undefined)).toBeNull();
    expect(sanitizeBackHref(null)).toBeNull();
    expect(sanitizeBackHref(['/search?q=a', '/search?q=b'])).toBeNull();
    expect(sanitizeBackHref('')).toBeNull();
    expect(sanitizeBackHref('search?q=x')).toBeNull();
  });
});

describe('withBackHref', () => {
  it('appends the back target as an encoded from param', () => {
    expect(withBackHref('/movie/603', '/search?q=batman&mediaType=all')).toBe(
      '/movie/603?from=%2Fsearch%3Fq%3Dbatman%26mediaType%3Dall',
    );
  });

  it('round-trips through sanitizeBackHref', () => {
    const href = withBackHref('/tv/1396', '/search?q=the%20wire&mediaType=all');
    const from = new URL(href, 'http://internal').searchParams.get('from');

    expect(sanitizeBackHref(from)).toBe('/search?q=the%20wire&mediaType=all');
  });

  it('uses & when the href already has a query string', () => {
    expect(withBackHref('/movie/603?foo=1', '/search?q=x')).toBe(
      '/movie/603?foo=1&from=%2Fsearch%3Fq%3Dx',
    );
  });
});
