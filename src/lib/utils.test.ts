import { describe, it, expect, vi } from 'vitest';
import {
  formatDateYear,
  formatImageUrl,
  cn,
  formatCurrency,
  formatRuntime,
  deduplicateAndSortByPopularity,
  isValidRedirectUrl,
  getSafeRedirectUrl,
  createLoginUrl,
} from './utils';

// Mock the constants - using actual IMAGE_CDN_URL value from constants.ts
vi.mock('@/lib/constants', () => ({
  IMAGE_CDN_URL: 'https://image.tmdb.org/t/p/',
}));

describe('formatDateYear', () => {
  it('should extract year from standard date string', () => {
    expect(formatDateYear('2023-12-25')).toBe('2023');
    expect(formatDateYear('1999-01-01')).toBe('1999');
    expect(formatDateYear('2000-06-15')).toBe('2000');
  });

  it('should handle single year format', () => {
    expect(formatDateYear('2023')).toBe('2023');
  });

  it('should handle empty string', () => {
    expect(formatDateYear('')).toBe('');
  });

  it('should handle malformed date strings', () => {
    expect(formatDateYear('invalid-date')).toBe('invalid');
    expect(formatDateYear('2023/12/25')).toBe('2023/12/25');
    expect(formatDateYear('not-a-date')).toBe('not');
  });

  it('should handle date strings with time components', () => {
    expect(formatDateYear('2023-12-25T10:30:00Z')).toBe('2023');
    expect(formatDateYear('2023-12-25 14:30:00')).toBe('2023');
  });

  it('should handle edge cases with optional chaining', () => {
    expect(formatDateYear('2023-')).toBe('2023');
    expect(formatDateYear('-12-25')).toBe('');
  });
});

describe('formatImageUrl', () => {
  it('should format image URL with default width', () => {
    expect(formatImageUrl('/image.jpg')).toBe('https://image.tmdb.org/t/p/w500/image.jpg');
  });

  it('should format image URL with custom width', () => {
    expect(formatImageUrl('/image.jpg', 300)).toBe('https://image.tmdb.org/t/p/w300/image.jpg');
    expect(formatImageUrl('/image.jpg', 1200)).toBe('https://image.tmdb.org/t/p/w1200/image.jpg');
  });

  it('should return empty string for null path', () => {
    expect(formatImageUrl(null)).toBe('');
    expect(formatImageUrl(null, 300)).toBe('');
  });

  it('should handle empty string path', () => {
    expect(formatImageUrl('')).toBe('https://image.tmdb.org/t/p/w500');
  });

  it('should handle paths without leading slash', () => {
    expect(formatImageUrl('image.jpg')).toBe('https://image.tmdb.org/t/p/w500image.jpg');
  });

  it('should handle zero and negative widths', () => {
    expect(formatImageUrl('/image.jpg', 0)).toBe('https://image.tmdb.org/t/p/w0/image.jpg');
    expect(formatImageUrl('/image.jpg', -100)).toBe('https://image.tmdb.org/t/p/w-100/image.jpg');
  });

  it('should handle various image file extensions', () => {
    expect(formatImageUrl('/poster.png', 500)).toBe('https://image.tmdb.org/t/p/w500/poster.png');
    expect(formatImageUrl('/backdrop.webp', 1920)).toBe('https://image.tmdb.org/t/p/w1920/backdrop.webp');
  });

  it('should handle paths with subdirectories', () => {
    expect(formatImageUrl('/movies/2023/poster.jpg')).toBe('https://image.tmdb.org/t/p/w500/movies/2023/poster.jpg');
  });
});

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
  });

  it('should merge conflicting Tailwind classes properly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('should handle objects with conditional classes', () => {
    expect(cn({ 'class1': true, 'class2': false, 'class3': true })).toBe('class1 class3');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('', null, undefined)).toBe('');
  });

  it('should handle mixed input types', () => {
    expect(cn('base', { 'conditional': true }, ['array', 'classes'], null, 'final')).toBe('base conditional array classes final');
  });

  it('should handle complex Tailwind merge scenarios', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
  });
});

describe('formatCurrency', () => {
  it('should format currency with symbol by default', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(50)).toBe('$50');
  });

  it('should format currency without symbol when specified', () => {
    expect(formatCurrency(1000, false)).toBe('USD 1,000');
    expect(formatCurrency(0, false)).toBe('USD 0');
  });

  it('should handle decimal amounts by rounding', () => {
    expect(formatCurrency(1000.99)).toBe('$1,001');
    expect(formatCurrency(1000.49)).toBe('$1,000');
    expect(formatCurrency(1000.5)).toBe('$1,001');
  });

  it('should handle negative amounts', () => {
    expect(formatCurrency(-1000)).toBe('-$1,000');
    expect(formatCurrency(-1000, false)).toBe('-USD 1,000');
  });

  it('should handle large numbers with proper formatting', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000');
    expect(formatCurrency(1234567)).toBe('$1,234,567');
    expect(formatCurrency(999999999)).toBe('$999,999,999');
  });

  it('should handle edge cases with small decimals', () => {
    expect(formatCurrency(0.1)).toBe('$0');
    expect(formatCurrency(0.9)).toBe('$1');
    expect(formatCurrency(0.5)).toBe('$1');
  });

  it('should maintain consistent formatting for both symbol modes', () => {
    expect(formatCurrency(12345, true)).toBe('$12,345');
    expect(formatCurrency(12345, false)).toBe('USD 12,345');
  });
});

describe('formatRuntime', () => {
  it('should format minutes only when less than 60', () => {
    expect(formatRuntime(45)).toBe('45m');
    expect(formatRuntime(1)).toBe('1m');
    expect(formatRuntime(59)).toBe('59m');
  });

  it('should format hours and minutes when 60 or more', () => {
    expect(formatRuntime(60)).toBe('1h 0m');
    expect(formatRuntime(90)).toBe('1h 30m');
    expect(formatRuntime(120)).toBe('2h 0m');
    expect(formatRuntime(150)).toBe('2h 30m');
  });

  it('should handle zero minutes', () => {
    expect(formatRuntime(0)).toBe('0m');
  });

  it('should handle large runtimes', () => {
    expect(formatRuntime(1440)).toBe('24h 0m');
    expect(formatRuntime(1500)).toBe('25h 0m');
    expect(formatRuntime(3600)).toBe('60h 0m');
  });

  it('should handle decimal minutes by using Math.floor', () => {
    expect(formatRuntime(90.9)).toBe('1h 30m');
    expect(formatRuntime(59.9)).toBe('59m');
    expect(formatRuntime(119.5)).toBe('1h 59m');
  });

  it('should handle typical movie runtimes', () => {
    expect(formatRuntime(102)).toBe('1h 42m'); // Typical movie
    expect(formatRuntime(180)).toBe('3h 0m'); // Long movie
    expect(formatRuntime(95)).toBe('1h 35m'); // Short movie
  });
});

describe('deduplicateAndSortByPopularity', () => {
  interface TestItem {
    id: number;
    popularity: number;
    name: string;
    date?: string;
  }

  const getDateString = (item: TestItem) => item.date || '';

  it('should remove duplicates by ID keeping first occurrence', () => {
    const items: TestItem[] = [
      { id: 1, popularity: 100, name: 'first', date: '2023-01-01' },
      { id: 2, popularity: 200, name: 'second', date: '2023-01-02' },
      { id: 1, popularity: 300, name: 'duplicate', date: '2023-01-03' },
    ];

    const result = deduplicateAndSortByPopularity(items, getDateString);
    
    expect(result).toHaveLength(2);
    expect(result.find(item => item.id === 1)?.name).toBe('first');
  });

  it('should sort by popularity descending', () => {
    const items: TestItem[] = [
      { id: 1, popularity: 100, name: 'low', date: '2023-01-01' },
      { id: 2, popularity: 300, name: 'high', date: '2023-01-01' },
      { id: 3, popularity: 200, name: 'medium', date: '2023-01-01' },
    ];

    const result = deduplicateAndSortByPopularity(items, getDateString);
    
    expect(result[0].name).toBe('high');
    expect(result[1].name).toBe('medium');
    expect(result[2].name).toBe('low');
  });

  it('should sort by date descending when popularity is equal', () => {
    const items: TestItem[] = [
      { id: 1, popularity: 100, name: 'old', date: '2023-01-01' },
      { id: 2, popularity: 100, name: 'new', date: '2023-12-31' },
      { id: 3, popularity: 100, name: 'medium', date: '2023-06-15' },
    ];

    const result = deduplicateAndSortByPopularity(items, getDateString);
    
    expect(result[0].name).toBe('new');
    expect(result[1].name).toBe('medium');
    expect(result[2].name).toBe('old');
  });

  it('should handle missing dates with default fallback', () => {
    const items: TestItem[] = [
      { id: 1, popularity: 100, name: 'no-date' },
      { id: 2, popularity: 100, name: 'with-date', date: '2023-01-01' },
    ];

    const result = deduplicateAndSortByPopularity(items, getDateString);
    
    expect(result[0].name).toBe('with-date');
    expect(result[1].name).toBe('no-date');
  });

  it('should handle invalid dates with default fallback', () => {
    const items: TestItem[] = [
      { id: 1, popularity: 100, name: 'invalid-date', date: 'invalid' },
      { id: 2, popularity: 100, name: 'valid-date', date: '2023-01-01' },
    ];

    const result = deduplicateAndSortByPopularity(items, getDateString);
    
    expect(result[0].name).toBe('valid-date');
    expect(result[1].name).toBe('invalid-date');
  });

  it('should handle empty array', () => {
    const result = deduplicateAndSortByPopularity([], getDateString);
    expect(result).toEqual([]);
  });

  it('should handle single item', () => {
    const items: TestItem[] = [
      { id: 1, popularity: 100, name: 'single', date: '2023-01-01' },
    ];

    const result = deduplicateAndSortByPopularity(items, getDateString);
    expect(result).toEqual(items);
  });

  it('should handle complex sorting scenario with multiple criteria', () => {
    const items: TestItem[] = [
      { id: 1, popularity: 200, name: 'high-old', date: '2023-01-01' },
      { id: 2, popularity: 300, name: 'highest', date: '2023-01-01' },
      { id: 3, popularity: 200, name: 'high-new', date: '2023-12-31' },
      { id: 4, popularity: 100, name: 'low', date: '2023-06-15' },
      { id: 1, popularity: 400, name: 'duplicate-high', date: '2023-12-31' }, // duplicate, should be ignored
    ];

    const result = deduplicateAndSortByPopularity(items, getDateString);
    
    expect(result).toHaveLength(4);
    expect(result[0].name).toBe('highest'); // popularity 300
    expect(result[1].name).toBe('high-new'); // popularity 200, newer date
    expect(result[2].name).toBe('high-old'); // popularity 200, older date
    expect(result[3].name).toBe('low'); // popularity 100
  });

  it('should handle items with zero popularity', () => {
    const items: TestItem[] = [
      { id: 1, popularity: 0, name: 'zero-pop', date: '2023-01-01' },
      { id: 2, popularity: 100, name: 'some-pop', date: '2023-01-01' },
    ];

    const result = deduplicateAndSortByPopularity(items, getDateString);
    
    expect(result[0].name).toBe('some-pop');
    expect(result[1].name).toBe('zero-pop');
  });

  it('should handle negative popularity values', () => {
    const items: TestItem[] = [
      { id: 1, popularity: -50, name: 'negative', date: '2023-01-01' },
      { id: 2, popularity: 50, name: 'positive', date: '2023-01-01' },
    ];

    const result = deduplicateAndSortByPopularity(items, getDateString);
    
    expect(result[0].name).toBe('positive');
    expect(result[1].name).toBe('negative');
  });
});

describe('isValidRedirectUrl', () => {
  it('should return true for valid relative URLs', () => {
    expect(isValidRedirectUrl('/')).toBe(true);
    expect(isValidRedirectUrl('/home')).toBe(true);
    expect(isValidRedirectUrl('/path/to/page')).toBe(true);
    expect(isValidRedirectUrl('/search?q=test')).toBe(true);
    expect(isValidRedirectUrl('/page#section')).toBe(true);
  });

  it('should return false for URLs with protocols', () => {
    expect(isValidRedirectUrl('http://example.com')).toBe(false);
    expect(isValidRedirectUrl('https://example.com')).toBe(false);
    expect(isValidRedirectUrl('ftp://example.com')).toBe(false);
    expect(isValidRedirectUrl('javascript://alert(1)')).toBe(false);
  });

  it('should return false for protocol-relative URLs', () => {
    expect(isValidRedirectUrl('//example.com')).toBe(false);
    expect(isValidRedirectUrl('//evil.com/path')).toBe(false);
  });

  it('should return false for non-string inputs', () => {
    expect(isValidRedirectUrl(undefined)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidRedirectUrl(null as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidRedirectUrl(123 as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidRedirectUrl({} as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidRedirectUrl([] as any)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidRedirectUrl('')).toBe(false);
  });

  it('should return false for URLs not starting with /', () => {
    expect(isValidRedirectUrl('home')).toBe(false);
    expect(isValidRedirectUrl('path/to/page')).toBe(false);
    expect(isValidRedirectUrl('example.com')).toBe(false);
  });

  it('should handle edge cases with protocol-like strings in path', () => {
    expect(isValidRedirectUrl('/path://not-a-protocol')).toBe(false);
    expect(isValidRedirectUrl('/http://in-path')).toBe(false);
    expect(isValidRedirectUrl('/file://localhost/path')).toBe(false);
  });

  it('should handle URLs with valid query parameters and fragments', () => {
    expect(isValidRedirectUrl('/search?query=hello%20world')).toBe(true);
    expect(isValidRedirectUrl('/page?a=1&b=2&c=3')).toBe(true);
    expect(isValidRedirectUrl('/docs#introduction')).toBe(true);
    expect(isValidRedirectUrl('/article?id=123#comments')).toBe(true);
  });

  it('should handle various malicious URL attempts', () => {
    expect(isValidRedirectUrl('\\\\evil.com')).toBe(false);
    expect(isValidRedirectUrl('/\\evil.com')).toBe(true); // This would be a valid relative path
    expect(isValidRedirectUrl('///evil.com')).toBe(false);
    expect(isValidRedirectUrl('/../../etc/passwd')).toBe(true); // Valid relative path, though potentially dangerous
  });
});

describe('getSafeRedirectUrl', () => {
  it('should return valid URLs unchanged', () => {
    expect(getSafeRedirectUrl('/')).toBe('/');
    expect(getSafeRedirectUrl('/home')).toBe('/home');
    expect(getSafeRedirectUrl('/path/to/page')).toBe('/path/to/page');
  });

  it('should return "/" for invalid URLs', () => {
    expect(getSafeRedirectUrl('http://example.com')).toBe('/');
    expect(getSafeRedirectUrl('//example.com')).toBe('/');
    expect(getSafeRedirectUrl('javascript://alert(1)')).toBe('/');
  });

  it('should return "/" for undefined or null', () => {
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getSafeRedirectUrl(null as any)).ToBe('/');
  });

  it('should return "/" for empty string', () => {
    expect(getSafeRedirectUrl('')).ToBe('/');
  });

  it('should return "/" for non-string inputs', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getSafeRedirectUrl(123 as any)).toBe('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getSafeRedirectUrl({} as any)).toBe('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getSafeRedirectUrl([] as any)).toBe('/');
  });

  it('should handle complex valid URLs', () => {
    expect(getSafeRedirectUrl('/dashboard?tab=settings&view=advanced')).toBe('/dashboard?tab=settings&view=advanced');
    expect(getSafeRedirectUrl('/article/123#comments')).toBe('/article/123#comments');
  });

  it('should consistently return "/" for all invalid cases', () => {
    const invalidUrls = [
      'https://evil.com',
      '//evil.com',
      'ftp://files.com',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'relative-path',
      'no-slash.html'
    ];

    invalidUrls.forEach(url => {
      expect(getSafeRedirectUrl(url)).toBe('/');
    });
  });
});

describe('createLoginUrl', () => {
  it('should create login URLs with valid redirect URLs', () => {
    expect(createLoginUrl('/home')).toBe('/login?redirect_url=%2Fhome');
    expect(createLoginUrl('/dashboard')).toBe('/login?redirect_url=%2Fdashboard');
    expect(createLoginUrl('/path/to/page')).toBe('/login?redirect_url=%2Fpath%2Fto%2Fpage');
  });

  it('should handle URLs with query parameters', () => {
    expect(createLoginUrl('/search?q=test')).toBe('/login?redirect_url=%2Fsearch%3Fq%3Dtest');
  });

  it('should handle URLs with fragments', () => {
    expect(createLoginUrl('/page#section')).toBe('/login?redirect_url=%2Fpage%23section');
  });

  it('should return "/" for invalid redirect URLs', () => {
    expect(createLoginUrl('http://example.com')).toBe('/');
    expect(createLoginUrl('//example.com')).toBe('/');
    expect(createLoginUrl('javascript://alert(1)')).toBe('/');
  });

  it('should return "/" for undefined redirect URL', () => {
    expect(createLoginUrl(undefined)).toBe('/');
  });

  it('should return "/" for empty string', () => {
    expect(createLoginUrl('')).toBe('/');
  });

  it('should return "/" for non-string inputs', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(createLoginUrl(123 as any)).ToBe('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(createLoginUrl({} as any)).toBe('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(createLoginUrl([] as any)).toBe('/');
  });

  it('should properly encode special characters in redirect URL', () => {
    expect(createLoginUrl('/path with spaces')).toBe('/login?redirect_url=%2Fpath%20with%20spaces');
    expect(createLoginUrl('/path?param=value&other=test')).toBe('/login?redirect_url=%2Fpath%3Fparam%3Dvalue%26other%3Dtest');
  });

  it('should handle complex URLs with multiple parameters', () => {
    expect(createLoginUrl('/search?q=hello world&filter=recent&sort=date')).toBe('/login?redirect_url=%2Fsearch%3Fq%3Dhello%20world%26filter%3Drecent%26sort%3Ddate');
  });

  it('should handle URLs with encoded characters', () => {
    expect(createLoginUrl('/path%20already%20encoded')).ToBe('/login?redirect_url=%2Fpath%2520already%2520encoded');
  });

  it('should handle root path correctly', () => {
    expect(createLoginUrl('/')).toBe('/login?redirect_url=%2F');
  });
});