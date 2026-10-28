import { createCatalogImdbService } from '@server/catalog-imdb-service';
import { describe, expect, it, vi } from 'vite-plus/test';

const input = { id: 42, type: 'movie' } as const;
describe('catalog IMDb service', () => {
  it.each(['movie', 'tv'] as const)(
    'uses %s external IDs and the shared rating reader',
    async (type) => {
      const fetcher = vi.fn().mockResolvedValue({ imdb_id: 'tt0816692', private_field: 'discard' });
      const readRating = vi.fn().mockResolvedValue({ rating: 8.7, numVotes: 2400000 });
      expect(
        await createCatalogImdbService(fetcher, { readRating }).imdb({ id: 42, type }),
      ).toEqual({
        url: 'https://www.imdb.com/title/tt0816692/',
        rating: { rating: 8.7, numVotes: 2400000 },
        ratingUnavailable: false,
      });
      expect(fetcher).toHaveBeenCalledExactlyOnceWith(`/${type}/42/external_ids`);
      expect(readRating).toHaveBeenCalledExactlyOnceWith('tt0816692');
    },
  );
  it.each([null, undefined])(
    'does not query the database for a missing mapping: %j',
    async (imdb_id) => {
      const readRating = vi.fn();
      expect(
        await createCatalogImdbService(vi.fn().mockResolvedValue({ imdb_id }), { readRating }).imdb(
          input,
        ),
      ).toEqual({ url: null, rating: null, ratingUnavailable: false });
      expect(readRating).not.toHaveBeenCalled();
    },
  );
  it('keeps the title link without a configured reader or ingested rating', async () => {
    const fetcher = vi.fn().mockResolvedValue({ imdb_id: 'tt0816692' });
    expect(await createCatalogImdbService(fetcher).imdb(input)).toEqual({
      url: 'https://www.imdb.com/title/tt0816692/',
      rating: null,
      ratingUnavailable: false,
    });
    expect(
      await createCatalogImdbService(fetcher, { readRating: vi.fn().mockResolvedValue(null) }).imdb(
        input,
      ),
    ).toEqual({
      url: 'https://www.imdb.com/title/tt0816692/',
      rating: null,
      ratingUnavailable: false,
    });
  });
  it('reports a recoverable rating outage without discarding the known title link', async () => {
    const error = new Error('private database details');
    const onRatingError = vi.fn();
    const service = createCatalogImdbService(vi.fn().mockResolvedValue({ imdb_id: 'tt0816692' }), {
      readRating: vi.fn().mockRejectedValue(error),
      onRatingError,
    });
    expect(await service.imdb(input)).toEqual({
      url: 'https://www.imdb.com/title/tt0816692/',
      rating: null,
      ratingUnavailable: true,
    });
    expect(onRatingError).toHaveBeenCalledExactlyOnceWith(error, input);
    expect(
      await createCatalogImdbService(vi.fn().mockResolvedValue({ imdb_id: 'tt0816692' }), {
        readRating: vi.fn().mockRejectedValue(error),
      }).imdb(input),
    ).toMatchObject({ ratingUnavailable: true });
  });
  it.each(['javascript:alert(1)', 'nm0000123', 42, 'tt123'])(
    'rejects malformed mappings before storage access: %j',
    async (imdb_id) => {
      const readRating = vi.fn();
      await expect(
        createCatalogImdbService(vi.fn().mockResolvedValue({ imdb_id }), { readRating }).imdb(
          input,
        ),
      ).rejects.toThrow();
      expect(readRating).not.toHaveBeenCalled();
    },
  );
  it('propagates upstream mapping outages', async () => {
    await expect(
      createCatalogImdbService(vi.fn().mockRejectedValue(new Error('mapping outage'))).imdb(input),
    ).rejects.toThrow('mapping outage');
  });
});
