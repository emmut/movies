import { appRouter, type AppRouterClient } from '@movies/api/router';
import { createRouterClient } from '@orpc/server';
import { mockServices } from '@server/test-services';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const listId = '00000000-0000-4000-8000-000000000001';
const itemId = '00000000-0000-4000-8000-000000000002';
const resource = { resourceType: 'movie' as const, resourceId: 42 };
const customList = { domain: 'customLists', listId };
const services = mockServices();
const onMutation = vi.fn();
const user = {
  id: 'owner',
  name: 'Owner',
  email: 'owner@example.com',
  image: null,
  isAnonymous: false,
};
const client = createRouterClient(appRouter, {
  context: { ...services, session: { current: async () => user }, onMutation },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(services.customLists.create).mockResolvedValue({ success: true, listId });
  for (const name of ['update', 'delete', 'add', 'remove', 'move', 'moveItem'] as const) {
    vi.mocked(services.customLists[name]).mockResolvedValue({ success: true });
  }
  vi.mocked(services.systemLists.toggle).mockResolvedValue({ action: 'added' });
  vi.mocked(services.systemLists.move).mockResolvedValue({ success: true });
  vi.mocked(services.preferences.setRegion).mockResolvedValue({ region: 'SE' });
  vi.mocked(services.preferences.setProviders).mockResolvedValue({ providerIds: [8] });
  vi.mocked(services.preferences.region).mockResolvedValue({ region: 'SE' });
});

const writes = [
  {
    name: 'create list',
    call: (api: AppRouterClient) => api.customLists.create({ name: 'Favorites' }),
    event: { domain: 'customLists' },
  },
  {
    name: 'edit list',
    call: (api: AppRouterClient) => api.customLists.update({ listId, name: 'Edited' }),
    event: customList,
  },
  {
    name: 'delete list',
    call: (api: AppRouterClient) => api.customLists.delete({ listId }),
    event: customList,
  },
  {
    name: 'add item',
    call: (api: AppRouterClient) => api.customLists.add({ listId, ...resource }),
    event: { ...customList, resource },
  },
  {
    name: 'remove item',
    call: (api: AppRouterClient) => api.customLists.remove({ listId, ...resource }),
    event: { ...customList, resource },
  },
  {
    name: 'move list',
    call: (api: AppRouterClient) => api.customLists.move({ listId, position: 0 }),
    event: customList,
  },
  {
    name: 'move item',
    call: (api: AppRouterClient) => api.customLists.moveItem({ itemId, position: 0 }),
    event: { domain: 'customLists' },
  },
  {
    name: 'toggle system list',
    call: (api: AppRouterClient) => api.systemLists.toggle({ listType: 'watchlist', ...resource }),
    event: { domain: 'systemLists', listType: 'watchlist', resource },
  },
  {
    name: 'reorder system list',
    call: (api: AppRouterClient) =>
      api.systemLists.move({ listType: 'watched', resourceType: 'movie', itemId, position: 0 }),
    event: { domain: 'systemLists', listType: 'watched' },
  },
  {
    name: 'set region',
    call: (api: AppRouterClient) => api.preferences.setRegion({ region: 'SE' }),
    event: { domain: 'preferences' },
  },
  {
    name: 'set providers',
    call: (api: AppRouterClient) => api.preferences.setProviders({ providerIds: [8] }),
    event: { domain: 'preferences' },
  },
];

describe('typed mutation effects', () => {
  it.each(writes)(
    'emits the verified account and affected resources after $name',
    async ({ call, event }) => {
      await call(client);
      expect(onMutation).toHaveBeenCalledExactlyOnceWith({ ...event, userId: 'owner' });
    },
  );
  it('does not invalidate for reads', async () => {
    await client.preferences.region();
    expect(onMutation).not.toHaveBeenCalled();
  });
  it('does not invalidate when the service rejects the write', async () => {
    vi.mocked(services.customLists.create).mockRejectedValueOnce(new Error('Database unavailable'));
    await expect(client.customLists.create({ name: 'Favorites' })).rejects.toThrow();
    expect(onMutation).not.toHaveBeenCalled();
  });
});
