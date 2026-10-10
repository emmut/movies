import type { AppRouterClient } from '@movies/api/router';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createApp } from '@server/app';
import { describe, expect, it, vi } from 'vitest';

function setup() {
  const search = { list: vi.fn().mockResolvedValue({ items: [], totalPages: 0 }) };
  const person = { details: vi.fn(), credits: vi.fn().mockResolvedValue([]) };
  const app = createApp({
    search,
    person,
    home: { list: vi.fn(), trending: vi.fn() },
    discovery: { list: vi.fn(), options: vi.fn() },
    catalog: { details: vi.fn(), trailer: vi.fn(), providers: vi.fn(), related: vi.fn() },
  });
  const client: AppRouterClient = createORPCClient(
    new RPCLink({
      url: 'http://localhost/rpc',
      fetch: async (request, init) => app.request(request, init),
    }),
  );
  return { search, person, app, client };
}
describe('search and person RPC contracts', () => {
  it('normalizes query defaults and roundtrips supported person credits', async () => {
    const { client, search, person } = setup();
    expect(await client.search.list({ query: ' Alien ' })).toEqual({ items: [], totalPages: 0 });
    expect(search.list).toHaveBeenCalledWith({ query: 'Alien', type: 'all', page: 1 });
    expect(await client.person.credits({ id: 7, type: 'tv' })).toEqual([]);
    expect(person.credits).toHaveBeenCalledWith({ id: 7, type: 'tv' });
  });
  it.each([
    ['search/list', { query: '' }],
    ['search/list', { query: 'Alien', page: 501 }],
    ['search/list', { query: 'Alien', type: 'unsupported' }],
    ['person/details', { id: -1 }],
    ['person/credits', { id: 7, type: 'person' }],
  ])('rejects invalid %s input before accessing upstream', async (path, input) => {
    const { app, search, person } = setup();
    const response = await app.request('/rpc/' + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: input }),
    });
    expect(response.status).toBe(400);
    expect(search.list).not.toHaveBeenCalled();
    expect(person.details).not.toHaveBeenCalled();
    expect(person.credits).not.toHaveBeenCalled();
  });
  it('rejects invalid result identities at the output boundary', async () => {
    const { client, search } = setup();
    search.list.mockResolvedValueOnce({ items: [{ id: -1, type: 'person' }], totalPages: 1 });
    await expect(client.search.list({ query: 'test' })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
