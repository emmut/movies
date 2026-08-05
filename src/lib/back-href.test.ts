import { describe, expect, it } from 'vitest';

import { getBackHref } from './back-href';

const HOST = 'movies.example.com';

function referer(path: string) {
  return `https://${HOST}${path}`;
}

describe('getBackHref', () => {
  it('goes back to search with the query intact', () => {
    expect(getBackHref(referer('/search?q=batman&mediaType=movie&page=2'), HOST)).toBe(
      '/search?q=batman&mediaType=movie&page=2',
    );
  });

  it('goes back to discover with genre path and filters intact', () => {
    expect(getBackHref(referer('/discover/28?watchProvider=8&page=3'), HOST)).toBe(
      '/discover/28?watchProvider=8&page=3',
    );
  });

  it('goes back to home and other list pages', () => {
    expect(getBackHref(referer('/'), HOST)).toBe('/');
    expect(getBackHref(referer('/watchlist?mediaType=tv'), HOST)).toBe('/watchlist?mediaType=tv');
    expect(getBackHref(referer('/watched'), HOST)).toBe('/watched');
    expect(getBackHref(referer('/lists/abc123'), HOST)).toBe('/lists/abc123');
  });

  it('goes back to a detail page for cast/recommendation navigation', () => {
    expect(getBackHref(referer('/movie/603'), HOST)).toBe('/movie/603');
    expect(getBackHref(referer('/tv/1396'), HOST)).toBe('/tv/1396');
    expect(getBackHref(referer('/person/6384'), HOST)).toBe('/person/6384');
  });

  it('defaults to discover when there is no referer', () => {
    expect(getBackHref(null, HOST)).toBe('/discover');
    expect(getBackHref('', HOST)).toBe('/discover');
  });

  it('defaults to discover for login and unknown routes', () => {
    expect(getBackHref(referer('/login'), HOST)).toBe('/discover');
    expect(getBackHref(referer('/api/auth/callback/discord'), HOST)).toBe('/discover');
    expect(getBackHref(referer('/settings'), HOST)).toBe('/discover');
  });

  it('defaults to discover for referers from another host', () => {
    expect(getBackHref('https://evil.example/search?q=x', HOST)).toBe('/discover');
    expect(getBackHref(referer('/search?q=x'), 'other.example.com')).toBe('/discover');
  });

  it('defaults to discover when the host is unknown', () => {
    expect(getBackHref(referer('/search?q=x'), null)).toBe('/discover');
  });

  it('defaults to discover for malformed referers', () => {
    expect(getBackHref('not a url', HOST)).toBe('/discover');
  });
});
