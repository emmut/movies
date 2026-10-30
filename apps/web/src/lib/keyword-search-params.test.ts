import { describe, expect, it } from 'vite-plus/test';

import { loadKeywordSearchParams } from './keyword-search-params';

describe('keyword search parameters', () => {
  it('defaults to the first page of movies', () => {
    expect(loadKeywordSearchParams({})).toEqual({ page: 1, mediaType: 'movie' });
  });
  it('reads TV pagination from promised route parameters', async () => {
    await expect(
      loadKeywordSearchParams(Promise.resolve({ page: '3', mediaType: 'tv' })),
    ).resolves.toEqual({ page: 3, mediaType: 'tv' });
  });
  it('falls back to defaults for invalid values', () => {
    expect(loadKeywordSearchParams({ page: 'invalid', mediaType: 'unknown' })).toEqual({
      page: 1,
      mediaType: 'movie',
    });
  });
  it('preserves out-of-range integers for the page to reject', () => {
    expect(loadKeywordSearchParams({ page: '501' }).page).toBe(501);
    expect(loadKeywordSearchParams({ page: '0' }).page).toBe(0);
  });
});
