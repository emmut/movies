import { cacheLife, cacheTag } from 'next/cache';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { tmdbFetch } from '@/lib/tmdb';

import ImdbTitlePage from './page';

vi.mock('@/lib/tmdb', () => ({ tmdbFetch: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

function visit(imdbId = 'tt0390384') {
  return ImdbTitlePage({ params: Promise.resolve({ imdbId }) });
}

beforeEach(() => vi.clearAllMocks());

describe('IMDb title redirects', () => {
  it.each([
    [{ movie_results: [{ id: 14337 }], tv_results: [] }, '/movie/14337'],
    [{ movie_results: [], tv_results: [{ id: 1399 }] }, '/tv/1399'],
  ])('redirects a matched title to its detail page', async (results, destination) => {
    vi.mocked(tmdbFetch).mockResolvedValue(results);
    const error = await visit().catch((error: unknown) => error);
    expect(isRedirectError(error)).toBe(true);
    expect(error).toHaveProperty('digest', expect.stringContaining(`;${destination};`));
    expect(tmdbFetch).toHaveBeenCalledExactlyOnceWith('/find/tt0390384', {
      searchParams: { external_source: 'imdb_id' },
    });
    expect(cacheLife).toHaveBeenCalledWith('hours');
    expect(cacheTag).toHaveBeenCalledExactlyOnceWith('public:imdb:tt0390384:title');
  });

  it.each(['invalid', 'tt123', 'nm0390384', 'tt0390384/extra'])(
    'rejects invalid ID %s before calling TMDB',
    async (id) => {
      await expect(visit(id)).rejects.toHaveProperty('digest', 'NEXT_HTTP_ERROR_FALLBACK;404');
      expect(tmdbFetch).not.toHaveBeenCalled();
      expect(cacheTag).not.toHaveBeenCalled();
    },
  );

  it('returns not found for unmatched or unsupported titles', async () => {
    vi.mocked(tmdbFetch).mockResolvedValue({ movie_results: [], tv_results: [] });
    await expect(visit()).rejects.toHaveProperty('digest', 'NEXT_HTTP_ERROR_FALLBACK;404');
    expect(cacheTag).toHaveBeenCalledExactlyOnceWith('public:imdb:tt0390384:title');
  });

  it('propagates upstream failures instead of treating them as missing titles', async () => {
    vi.mocked(tmdbFetch).mockRejectedValue(new Error('TMDB unavailable'));
    await expect(visit()).rejects.toThrow('TMDB unavailable');
  });
});
