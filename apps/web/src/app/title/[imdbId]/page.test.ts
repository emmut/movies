import { cacheLife, cacheTag } from 'next/cache';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const resolveImdb = vi.hoisted(() => vi.fn());

import ImdbTitlePage from './page';

vi.mock('@/lib/api-server', () => ({ createServerApi: () => ({ catalog: { resolveImdb } }) }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

function visit(imdbId = 'tt0390384') {
  return ImdbTitlePage({ params: Promise.resolve({ imdbId }) });
}

beforeEach(() => vi.clearAllMocks());

describe('IMDb title redirects', () => {
  it.each([
    [{ id: 14337, type: 'movie' }, '/movie/14337'],
    [{ id: 1399, type: 'tv' }, '/tv/1399'],
  ])('redirects a matched title to its detail page', async (results, destination) => {
    vi.mocked(resolveImdb).mockResolvedValue(results);
    const error = await visit().catch((error: unknown) => error);
    expect(isRedirectError(error)).toBe(true);
    expect(error).toHaveProperty('digest', expect.stringContaining(`;${destination};`));
    expect(resolveImdb).toHaveBeenCalledExactlyOnceWith({ imdbId: 'tt0390384' });
    expect(cacheLife).toHaveBeenCalledWith('hours');
    expect(cacheTag).toHaveBeenCalledExactlyOnceWith('public:imdb:tt0390384:title');
  });

  it.each(['invalid', 'tt123', 'nm0390384', 'tt0390384/extra'])(
    'rejects invalid ID %s before calling TMDB',
    async (id) => {
      await expect(visit(id)).rejects.toHaveProperty('digest', 'NEXT_HTTP_ERROR_FALLBACK;404');
      expect(resolveImdb).not.toHaveBeenCalled();
      expect(cacheTag).not.toHaveBeenCalled();
    },
  );

  it('returns not found for unmatched or unsupported titles', async () => {
    vi.mocked(resolveImdb).mockResolvedValue(null);
    await expect(visit()).rejects.toHaveProperty('digest', 'NEXT_HTTP_ERROR_FALLBACK;404');
    expect(cacheTag).toHaveBeenCalledExactlyOnceWith('public:imdb:tt0390384:title');
  });

  it('propagates upstream failures instead of treating them as missing titles', async () => {
    vi.mocked(resolveImdb).mockRejectedValue(new Error('TMDB unavailable'));
    await expect(visit()).rejects.toThrow('TMDB unavailable');
  });
});
