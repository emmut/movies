import { routeUrl } from '@native/lib/route-url';
import { describe, expect, it } from 'vite-plus/test';

describe('native sign-in return URLs', () => {
  it('preserves country and query values without repeating dynamic route parameters', () => {
    expect(
      routeUrl('/discover/movie/42', { type: 'movie', id: '42', region: 'US' }, [
        '(tabs)',
        'discover',
        '[type]',
        '[id]',
      ]),
    ).toBe('/discover/movie/42?region=US');
  });
  it('preserves list filters, repeated values and encoded characters', () => {
    expect(
      routeUrl(
        '/more/watchlist',
        { page: '2', providerIds: ['8', '9'], query: 'a & b', absent: undefined },
        ['(tabs)', 'more', 'watchlist'],
      ),
    ).toBe('/more/watchlist?page=2&providerIds=8&providerIds=9&query=a+%26+b');
  });
  it('returns unfiltered routes without a trailing question mark', () => {
    expect(routeUrl('/more', {}, ['(tabs)', 'more'])).toBe('/more');
  });
  it('omits catch-all route parameters already represented in the path', () => {
    expect(
      routeUrl('/search/movie/42', { rest: ['movie', '42'], region: 'NO' }, [
        'search',
        '[...rest]',
      ]),
    ).toBe('/search/movie/42?region=NO');
  });
});
