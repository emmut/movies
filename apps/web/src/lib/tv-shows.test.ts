import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('./tmdb', () => ({ tmdbFetch: vi.fn(), addPosterImageUrls: vi.fn() }));
vi.mock('./tmdb-external-ids', () => ({ getTmdbExternalIds: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { getTmdbExternalIds } from './tmdb-external-ids';
import { getTvShowImdbId } from './tv-shows';

beforeEach(() => vi.clearAllMocks());

describe('TV IMDb identifier', () => {
  it('reads IMDb from the shared external-ID cache', async () => {
    vi.mocked(getTmdbExternalIds).mockResolvedValue({
      imdb_id: 'tt4574334',
      wikidata_id: 'Q19798734',
    });
    expect(await getTvShowImdbId(66732)).toBe('tt4574334');
    expect(getTmdbExternalIds).toHaveBeenCalledExactlyOnceWith('tv', 66732);
  });

  it('preserves a missing IMDb identifier', async () => {
    vi.mocked(getTmdbExternalIds).mockResolvedValue({ imdb_id: null, wikidata_id: 'Q19798734' });
    expect(await getTvShowImdbId(66732)).toBeNull();
  });
});
