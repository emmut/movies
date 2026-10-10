import type { AppRouterClient } from '@movies/api/router';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from './app';
import { createCatalogService } from './catalog-service';

function setup() {
  const fetcher = vi.fn().mockResolvedValue({ results: [] });
  const catalog = createCatalogService(fetcher);
  const app = createApp({ home: { list: vi.fn(), trending: vi.fn() }, catalog });
  const client: AppRouterClient = createORPCClient(
    new RPCLink({
      url: 'http://localhost/rpc',
      fetch: async (request, init) => app.request(request, init),
    }),
  );
  return { fetcher, app, client };
}
describe('supporting RPC transport', () => {
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
