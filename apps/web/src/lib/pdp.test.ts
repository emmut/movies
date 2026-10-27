import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
vi.mock('./tmdb', () => ({ tmdbFetch: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
import {
  getAggregateCredits,
  getCollection,
  getKeyword,
  getKeywordTitles,
  getPdpExtras,
  getSeason,
} from './pdp';
import { tmdbFetch } from './tmdb';

beforeEach(() => vi.clearAllMocks());
describe('PDP requests', () => {
  it('requests movie extras including regional releases', async () => {
    vi.mocked(tmdbFetch).mockResolvedValue({ images: { posters: [] } });
    await expect(getPdpExtras('movie', 603)).resolves.toEqual({ images: { posters: [] } });
    expect(tmdbFetch).toHaveBeenCalledWith(
      '/movie/603',
      expect.objectContaining({
        searchParams: {
          append_to_response: 'images,keywords,videos,release_dates',
          include_image_language: 'en,null',
        },
      }),
    );
  });
  it('does not request movie release dates for TV', async () => {
    await getPdpExtras('tv', 1396);
    expect(tmdbFetch).toHaveBeenCalledWith(
      '/tv/1396',
      expect.objectContaining({
        searchParams: expect.objectContaining({ append_to_response: 'images,keywords,videos' }),
      }),
    );
  });
  it.each([
    ['/collection/10', () => getCollection(10)],
    ['/tv/1396/season/0', () => getSeason(1396, 0)],
    ['/tv/1396/aggregate_credits', () => getAggregateCredits(1396)],
    ['/keyword/10', () => getKeyword(10)],
  ] as const)('loads %s including specials', async (path, fetcher) => {
    await fetcher();
    expect(tmdbFetch).toHaveBeenCalledWith(path, expect.anything());
  });
  it('preserves keyword, media type, page, and adult exclusion in discovery', async () => {
    await getKeywordTitles(10, 'tv', 2);
    expect(tmdbFetch).toHaveBeenCalledWith(
      '/discover/tv',
      expect.objectContaining({
        searchParams: {
          with_keywords: 10,
          page: 2,
          include_adult: 'false',
          sort_by: 'popularity.desc',
        },
      }),
    );
  });
});
