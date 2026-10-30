import { createApp } from '@server/app';
import { createCatalogService } from '@server/catalog-service';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vite-plus/test';

function setup() {
  const fetcher = vi.fn().mockResolvedValue({ imdb_id: 'tt0816692' });
  const readRating = vi.fn().mockResolvedValue({ rating: 8.7, numVotes: 2400000 });
  const app = createApp(mockServices({ catalog: createCatalogService(fetcher, { readRating }) }));
  return { app, fetcher, readRating, client: createTestClient(app) };
}
describe('IMDb RPC transport', () => {
  it('roundtrips public IMDb source, rating and votes', async () => {
    const { client } = setup();
    expect(await client.catalog.imdb({ id: 42, type: 'tv' })).toEqual({
      url: 'https://www.imdb.com/title/tt0816692/',
      rating: { rating: 8.7, numVotes: 2400000 },
      ratingUnavailable: false,
    });
  });
  it.each([
    { id: -1, type: 'movie' },
    { id: 42, type: 'person' },
    { id: Number.MAX_SAFE_INTEGER + 1, type: 'tv' },
  ])('rejects invalid title input before upstream access: %j', async (input) => {
    const { app, fetcher, readRating } = setup();
    const response = await app.request('/rpc/catalog/imdb', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: input }),
    });
    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
    expect(readRating).not.toHaveBeenCalled();
  });
  it('does not expose private database or upstream failure details', async () => {
    const { client, fetcher, readRating } = setup();
    readRating.mockRejectedValueOnce(new Error('private password details'));
    expect(await client.catalog.imdb({ id: 42, type: 'movie' })).toMatchObject({
      ratingUnavailable: true,
      rating: null,
      url: 'https://www.imdb.com/title/tt0816692/',
    });
    fetcher.mockRejectedValueOnce(new Error('private token details'));
    await expect(client.catalog.imdb({ id: 42, type: 'movie' })).rejects.toThrow(
      'Internal server error',
    );
  });
});
