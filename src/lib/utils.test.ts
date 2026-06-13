import { describe, expect, it } from 'vitest';

import {
  createLoginUrl,
  deduplicateAndSortByPopularity,
  formatCurrency,
  formatDateYear,
  formatImageUrl,
  formatRuntime,
  getErrorMessage,
  getSafeRedirectUrl,
  isValidRedirectUrl,
} from './utils';

describe('getErrorMessage', () => {
  it("returns the Error's message when given an Error", () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('returns the fallback for non-Error values', () => {
    expect(getErrorMessage('boom', 'fallback')).toBe('fallback');
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
    expect(getErrorMessage({ message: 'boom' }, 'fallback')).toBe('fallback');
  });
});

describe('isValidRedirectUrl', () => {
  it('accepts plain relative paths', () => {
    expect(isValidRedirectUrl('/')).toBe(true);
    expect(isValidRedirectUrl('/movie/123')).toBe(true);
    expect(isValidRedirectUrl('/lists?page=2')).toBe(true);
    expect(isValidRedirectUrl('/path#section')).toBe(true);
  });

  it('rejects empty, missing, and non-string input', () => {
    expect(isValidRedirectUrl()).toBe(false);
    expect(isValidRedirectUrl('')).toBe(false);
    // @ts-expect-error guarding runtime callers that may pass non-strings
    expect(isValidRedirectUrl(123)).toBe(false);
    // @ts-expect-error guarding runtime callers that may pass non-strings
    expect(isValidRedirectUrl(null)).toBe(false);
  });

  it('rejects paths that do not start with a slash', () => {
    expect(isValidRedirectUrl('movie/123')).toBe(false);
    expect(isValidRedirectUrl('http://evil.com')).toBe(false);
    expect(isValidRedirectUrl('https://evil.com')).toBe(false);
  });

  // CWE-601 open-redirect bypasses the browser URL parser normalizes away.
  it('rejects protocol-relative and backslash off-origin redirects', () => {
    expect(isValidRedirectUrl('//evil.com')).toBe(false);
    expect(isValidRedirectUrl('/\\evil.com')).toBe(false);
    expect(isValidRedirectUrl('/\\/evil.com')).toBe(false);
    expect(isValidRedirectUrl('\\/evil.com')).toBe(false);
  });

  it('rejects schemes smuggled behind a leading slash', () => {
    expect(isValidRedirectUrl('/javascript:alert(1)')).toBe(true); // stays same-origin path
    expect(isValidRedirectUrl('/%2F%2Fevil.com')).toBe(true); // encoded, stays same-origin
    expect(isValidRedirectUrl('/..//evil.com')).toBe(true); // path traversal stays same-origin
  });
});

describe('getSafeRedirectUrl', () => {
  it('returns the url when safe', () => {
    expect(getSafeRedirectUrl('/watchlist')).toBe('/watchlist');
  });

  it('falls back to "/" when unsafe or missing', () => {
    expect(getSafeRedirectUrl('//evil.com')).toBe('/');
    expect(getSafeRedirectUrl('https://evil.com')).toBe('/');
    expect(getSafeRedirectUrl()).toBe('/');
    expect(getSafeRedirectUrl('')).toBe('/');
  });
});

describe('createLoginUrl', () => {
  it('appends an encoded redirect for safe paths', () => {
    expect(createLoginUrl('/movie/1?x=2')).toBe(
      `/login?redirect_url=${encodeURIComponent('/movie/1?x=2')}`,
    );
  });

  it('returns "/" for unsafe or missing redirect', () => {
    expect(createLoginUrl()).toBe('/');
    expect(createLoginUrl('//evil.com')).toBe('/');
    expect(createLoginUrl('https://evil.com')).toBe('/');
  });
});

describe('formatDateYear', () => {
  it('extracts the year segment', () => {
    expect(formatDateYear('2024-05-01')).toBe('2024');
    expect(formatDateYear('1999')).toBe('1999');
  });

  it('returns empty string for empty input', () => {
    expect(formatDateYear('')).toBe('');
  });
});

describe('formatImageUrl', () => {
  it('builds a CDN url with default width', () => {
    expect(formatImageUrl('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
  });

  it('honours a custom width', () => {
    expect(formatImageUrl('/abc.jpg', 200)).toBe('https://image.tmdb.org/t/p/w200/abc.jpg');
  });

  it('returns empty string for null path', () => {
    expect(formatImageUrl(null)).toBe('');
  });
});

describe('formatRuntime', () => {
  it('formats hours and minutes', () => {
    expect(formatRuntime(125)).toBe('2h 5m');
    expect(formatRuntime(60)).toBe('1h 0m');
  });

  it('omits hours under an hour', () => {
    expect(formatRuntime(45)).toBe('45m');
    expect(formatRuntime(0)).toBe('0m');
  });
});

describe('formatCurrency', () => {
  it('formats with a symbol by default', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
  });

  it('formats with currency code when symbol disabled', () => {
    expect(formatCurrency(1000, false)).toBe('USD 1,000');
  });

  it('rounds to whole units', () => {
    expect(formatCurrency(1234.99)).toBe('$1,235');
  });
});

describe('deduplicateAndSortByPopularity', () => {
  const getDate = (item: { release_date: string }) => item.release_date;

  it('removes duplicate ids keeping the first occurrence', () => {
    const items = [
      { id: 1, popularity: 5, release_date: '2020-01-01' },
      { id: 1, popularity: 99, release_date: '2021-01-01' },
      { id: 2, popularity: 3, release_date: '2019-01-01' },
    ];
    const result = deduplicateAndSortByPopularity(items, getDate);
    expect(result.map((i) => i.id)).toEqual([1, 2]);
    expect(result[0].popularity).toBe(5); // kept first, not the higher-popularity dupe
  });

  it.each([
    {
      name: 'sorts by popularity descending',
      items: [
        { id: 1, popularity: 1, release_date: '2020-01-01' },
        { id: 2, popularity: 10, release_date: '2020-01-01' },
        { id: 3, popularity: 5, release_date: '2020-01-01' },
      ],
      expected: [2, 3, 1],
    },
    {
      name: 'breaks popularity ties by date descending',
      items: [
        { id: 1, popularity: 5, release_date: '2018-01-01' },
        { id: 2, popularity: 5, release_date: '2022-01-01' },
        { id: 3, popularity: 5, release_date: '2020-01-01' },
      ],
      expected: [2, 3, 1],
    },
    {
      name: 'treats missing dates as the 1900 epoch fallback',
      items: [
        { id: 1, popularity: 5, release_date: '' },
        { id: 2, popularity: 5, release_date: '2000-01-01' },
      ],
      expected: [2, 1],
    },
  ])('$name', ({ items, expected }) => {
    expect(deduplicateAndSortByPopularity(items, getDate).map((i) => i.id)).toEqual(expected);
  });

  it('returns an empty array unchanged', () => {
    expect(deduplicateAndSortByPopularity([], getDate)).toEqual([]);
  });
});
