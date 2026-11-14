import { customListContracts } from '@movies/api/custom-lists';
import type { SessionUser } from '@movies/api/session';
import { ORPCError } from '@orpc/server';
import { createApp } from '@server/app';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vite-plus/test';

const id = '00000000-0000-4000-8000-000000000001';
const user: SessionUser = {
  id: 'owner',
  name: 'Owner',
  email: 'owner@test.invalid',
  image: null,
  isAnonymous: true,
};
function setup(signedIn = true) {
  const services = mockServices();
  const auth = { current: vi.fn().mockResolvedValue(signedIn ? user : null), handle: vi.fn() };
  const app = createApp(services, undefined, [], auth);
  return { app, client: createTestClient(app), service: services.customLists };
}
const validInputs = {
  index: { page: 1 },
  details: { listId: id },
  create: { name: 'Favorites' },
  update: { listId: id, name: 'Favorites' },
  delete: { listId: id },
  add: { listId: id, resourceId: 1, resourceType: 'movie' },
  remove: { listId: id, resourceId: 1, resourceType: 'tv' },
  status: { resourceId: 1, resourceType: 'person' },
  move: { listId: id, position: 0 },
  moveItem: { itemId: id, position: 0 },
};
describe('authenticated custom list transport', () => {
  it.each(Object.keys(customListContracts))('requires a verified session for %s', async (name) => {
    const { app, service } = setup(false);
    const response = await app.request('/rpc/customLists/' + name, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: validInputs[name as keyof typeof validInputs] }),
    });
    expect(response.status).toBe(401);
    expect(service[name as keyof typeof service]).not.toHaveBeenCalled();
  });
  it('derives ownership from the session and normalizes create values', async () => {
    const { app, service } = setup();
    vi.mocked(service.create).mockResolvedValue({ success: true, listId: id });
    const response = await app.request('/rpc/customLists/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: { name: '  Favorites  ', userId: 'foreign' } }),
    });
    expect(response.status).toBe(200);
    expect(service.create).toHaveBeenCalledWith('owner', {
      name: 'Favorites',
      description: '',
      emoji: '📝',
    });
  });
  it.each([
    ['create', { name: ' ' }],
    ['create', { name: 'Favorites', emoji: 'invalid' }],
    ['update', { listId: 'bad', name: 'Title' }],
    ['details', { listId: id, page: 0 }],
    ['details', { listId: id, region: 'XX' }],
    ['add', { listId: id, resourceId: 2147483648, resourceType: 'movie' }],
    ['remove', { listId: id, resourceId: 1, resourceType: 'unknown' }],
    ['move', { listId: id, position: -1 }],
    ['moveItem', { itemId: 'bad', position: 0 }],
  ])('rejects malformed %s input before service execution', async (name, input) => {
    const { app, service } = setup();
    const response = await app.request('/rpc/customLists/' + name, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: input }),
    });
    expect(response.status).toBe(400);
    expect(service[name as keyof typeof service]).not.toHaveBeenCalled();
  });
  it('defaults pagination and preserves private domain failures', async () => {
    const { client, service } = setup();
    vi.mocked(service.details).mockRejectedValue(new ORPCError('NOT_FOUND'));
    await expect(client.customLists.details({ listId: id })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect(service.details).toHaveBeenCalledWith('owner', {
      listId: id,
      page: 1,
      providerIds: [],
      region: 'SE',
    });
    vi.mocked(service.add).mockRejectedValue(new ORPCError('CONFLICT'));
    await expect(
      client.customLists.add({ listId: id, resourceId: 1, resourceType: 'movie' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
