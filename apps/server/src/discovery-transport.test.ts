import type { AppRouterClient } from '@movies/api/router';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createApp } from '@server/app';
import { describe, expect, it, vi } from 'vitest';

function setup() {
  const discovery = {
    list: vi.fn().mockResolvedValue({ items: [], totalPages: 0, totalResults: 0 }),
    options: vi.fn().mockResolvedValue({ genres: [], providers: [], countries: [] }),
  };
  const app = createApp({
    home: { list: vi.fn(), trending: vi.fn() },
    catalog: { details: vi.fn(), trailer: vi.fn(), providers: vi.fn(), related: vi.fn() },
    discovery,
  });
  const client: AppRouterClient = createORPCClient(
    new RPCLink({
      url: 'http://localhost/rpc',
      fetch: async (request, init) => app.request(request, init),
    }),
  );
  return { app, client, discovery };
}
describe('discovery RPC transport', () => {
  it('roundtrips native list/options calls with canonical defaults', async () => {
    const { client, discovery } = setup();
    expect(await client.discovery.list({})).toEqual({ items: [], totalPages: 0, totalResults: 0 });
    expect(discovery.list).toHaveBeenCalledWith({
      type: 'movie',
      region: 'SE',
      page: 1,
      genreIds: [],
      providerIds: [],
      originCountries: [],
      sortBy: 'popularity.desc',
    });
    expect(await client.discovery.options({ type: 'tv', region: 'US' })).toEqual({
      genres: [],
      providers: [],
      countries: [],
    });
    expect(discovery.options).toHaveBeenCalledWith({ type: 'tv', region: 'US' });
  });
  it('rejects invalid filters at the transport boundary before the service runs', async () => {
    const { app, discovery } = setup();
    const response = await app.request('/rpc/discovery/list', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: { type: 'tv', sortBy: 'revenue.desc', page: 501 } }),
    });
    expect(response.status).toBe(400);
    expect(discovery.list).not.toHaveBeenCalled();
  });
  it('rejects invalid downstream data instead of emitting broken navigation cards', async () => {
    const { client, discovery } = setup();
    discovery.list.mockResolvedValueOnce({ items: [{ id: -1 }], totalPages: 1, totalResults: 1 });
    await expect(client.discovery.list({})).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
