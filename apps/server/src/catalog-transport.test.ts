import type { AppRouterClient } from '@movies/api/router';
import { TmdbRequestError } from '@movies/api/tmdb-fetch';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from './app';
import { createCatalogService } from './catalog-service';

function setup() {
  const fetchTmdb = vi
    .fn()
    .mockResolvedValueOnce({ id: 42, title: 'A movie' })
    .mockResolvedValueOnce({ results: [] });
  const catalog = createCatalogService(fetchTmdb);
  const app = createApp({ home: { list: vi.fn(), trending: vi.fn() }, catalog });
  const client: AppRouterClient = createORPCClient(
    new RPCLink({
      url: 'http://localhost/rpc',
      fetch: async (request, init) => app.request(request, init),
    }),
  );
  return { app, client, fetchTmdb, catalog };
}
describe('catalog RPC transport', () => {
  it('roundtrips normalized detail metadata with the default region', async () => {
    const { client } = setup();
    expect(await client.catalog.details({ id: 42, type: 'movie' })).toMatchObject({
      id: 42,
      type: 'movie',
      title: 'A movie',
      posterUrl: null,
      certification: null,
    });
  });
  it.each([
    { id: 0, type: 'movie' },
    { id: 1.5, type: 'movie' },
    { id: 42, type: 'person' },
    { id: 42, type: 'tv', region: 'XX' },
    { id: '42', type: 'movie' },
  ])('rejects invalid input before touching upstream', async (input) => {
    const { app, fetchTmdb } = setup();
    const response = await app.request('/rpc/catalog/details', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: input }),
    });
    expect(response.status).toBe(400);
    expect(fetchTmdb).not.toHaveBeenCalled();
  });
  it('surfaces a safe, defined not-found error', async () => {
    const { client, fetchTmdb } = setup();
    fetchTmdb
      .mockReset()
      .mockRejectedValueOnce(new TmdbRequestError('private upstream detail', 404))
      .mockResolvedValueOnce({ results: [] });
    await expect(client.catalog.details({ id: 42, type: 'movie' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Title not found',
    });
  });
  it('keeps outage details out of the response', async () => {
    const { client, fetchTmdb } = setup();
    fetchTmdb
      .mockReset()
      .mockRejectedValueOnce(new TmdbRequestError('private upstream detail', 503))
      .mockResolvedValueOnce({ results: [] });
    await expect(client.catalog.details({ id: 42, type: 'movie' })).rejects.toThrow(
      'Internal server error',
    );
  });
  it('does not accept malformed host output', async () => {
    const { client, catalog } = setup();
    vi.spyOn(catalog, 'details').mockImplementationOnce(vi.fn().mockResolvedValue(null));
    await expect(client.catalog.details({ id: 42, type: 'movie' })).rejects.toThrow(
      'Output validation failed',
    );
  });
});
