import { createApp } from '@server/app';
import { createCatalogService } from '@server/catalog-service';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vite-plus/test';

function setup() {
  const fetcher = vi.fn().mockResolvedValue({ results: [] });
  const catalog = createCatalogService(fetcher);
  const app = createApp(mockServices({ catalog }));
  const client = createTestClient(app);
  return { fetcher, app, client };
}
describe('supporting RPC transport', () => {
  it.each(['movie', 'tv'] as const)(
    'roundtrips %s credits through the public contract',
    async (type) => {
      const { client, fetcher } = setup();
      fetcher.mockResolvedValue({
        cast: [{ id: 7, credit_id: 'a', name: 'Actor', character: 'Lead' }],
        crew: [],
      });
      expect(await client.catalog.credits({ id: 42, type })).toEqual({
        ...(type === 'movie' ? { crew: [] } : {}),
        cast: [{ id: 7, creditId: 'a', name: 'Actor', role: 'Lead', profileUrl: null }],
        directors: [],
        writers: [],
      });
      expect(fetcher).toHaveBeenCalledWith(`/${type}/42/credits`);
    },
  );
  it('roundtrips trailer, provider and related outputs with canonical defaults', async () => {
    const { client, fetcher } = setup();
    expect(await client.catalog.trailer({ id: 42, type: 'movie' })).toBeNull();
    fetcher.mockResolvedValueOnce({ results: {} });
    expect(await client.catalog.providers({ id: 42, type: 'tv' })).toMatchObject({
      streaming: [],
      link: 'https://www.themoviedb.org/tv/42/watch',
    });
    expect(await client.catalog.related({ id: 42, type: 'tv', kind: 'recommendations' })).toEqual(
      [],
    );
    expect(fetcher).toHaveBeenLastCalledWith('/tv/42/recommendations', {
      searchParams: { region: 'SE' },
    });
  });
  it.each([
    ['trailer', { id: -1, type: 'movie' }],
    ['credits', { id: 0, type: 'movie' }],
    ['credits', { id: 42, type: 'person' }],
    ['trailer', { id: 42, type: 'person' }],
    ['providers', { id: 42, type: 'movie', region: 'XX' }],
    ['related', { id: 42, type: 'tv', kind: 'invalid' }],
  ])('rejects invalid %s input before fetching', async (path, input) => {
    const { app, fetcher } = setup();
    const response = await app.request(`/rpc/catalog/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: input }),
    });
    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not expose private upstream failures', async () => {
    const { client, fetcher } = setup();
    fetcher.mockRejectedValue(new Error('private upstream secret'));
    await expect(client.catalog.credits({ id: 42, type: 'movie' })).rejects.toThrow(
      'Internal server error',
    );
    await expect(client.catalog.trailer({ id: 42, type: 'tv' })).rejects.toThrow(
      'Internal server error',
    );
    await expect(client.catalog.providers({ id: 42, type: 'tv' })).rejects.toThrow(
      'Internal server error',
    );
    await expect(client.catalog.related({ id: 42, type: 'tv', kind: 'similar' })).rejects.toThrow(
      'Internal server error',
    );
  });
});
