import { createApp } from '@server/app';
import { createCatalogService } from '@server/catalog-service';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vite-plus/test';

function setup() {
  const fetcher = vi.fn().mockResolvedValue({ results: [], total_pages: 0, total_results: 0 });
  const app = createApp(mockServices({ catalog: createCatalogService(fetcher) }));
  return { app, client: createTestClient(app), fetcher };
}

describe('reviews RPC contract', () => {
  it('exposes public movie/TV reviews with page-one defaults', async () => {
    const { client, fetcher } = setup();
    for (const type of ['movie', 'tv'] as const) {
      expect(await client.catalog.reviews({ id: 42, type })).toEqual({
        reviews: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
      });
      expect(fetcher).toHaveBeenLastCalledWith(`/${type}/42/reviews`, {
        searchParams: { page: '1' },
      });
    }
  });

  it.each([
    { id: 0, type: 'movie' },
    { id: Number.MAX_SAFE_INTEGER + 1, type: 'movie' },
    { id: 42, type: 'person' },
    { id: 42, type: 'movie', page: 0 },
    { id: 42, type: 'tv', page: 501 },
    { id: 42, type: 'tv', page: 1.5 },
  ])('rejects invalid inputs before upstream access: %j', async (input) => {
    const { app, fetcher } = setup();
    const response = await app.request('/rpc/catalog/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: input }),
    });
    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not disclose private upstream errors', async () => {
    const { client, fetcher } = setup();
    fetcher.mockRejectedValue(new Error('private access token details'));
    await expect(client.catalog.reviews({ id: 42, type: 'movie' })).rejects.toThrow(
      'Internal server error',
    );
  });
});
