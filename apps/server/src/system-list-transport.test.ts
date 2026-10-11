import type { SessionUser } from '@movies/api/session';
import { createApp } from '@server/app';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vitest';

const user: SessionUser = {
  id: 'owner',
  name: 'Owner',
  email: 'owner@test.invalid',
  image: null,
  isAnonymous: true,
};
const itemId = '00000000-0000-4000-8000-000000000001';
function setup(signedIn = true) {
  const systemLists = {
    page: vi
      .fn()
      .mockResolvedValue({
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        itemsPerPage: 20,
        counts: { movie: 0, tv: 0 },
        unavailableItems: 0,
      }),
    memberships: vi.fn().mockResolvedValue({ inWatchlist: true, watched: false }),
    toggle: vi.fn().mockResolvedValue({ action: 'added' }),
    move: vi.fn().mockResolvedValue({ success: true }),
    options: vi.fn().mockResolvedValue([]),
  };
  const auth = { current: vi.fn().mockResolvedValue(signedIn ? user : null), handle: vi.fn() };
  const app = createApp(mockServices({ systemLists }), undefined, [], auth);
  return { systemLists, app, client: createTestClient(app, { Cookie: 'test-session' }) };
}

describe('private system list procedures', () => {
  it('derives ownership from the anonymous session, ignoring caller identity', async () => {
    const { app, client, systemLists } = setup();
    const response = await app.request('/rpc/systemLists/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        json: { userId: 'other', listType: 'watchlist', resourceId: 42, resourceType: 'movie' },
      }),
    });
    expect(response.status).toBe(200);
    expect(systemLists.toggle).toHaveBeenCalledWith('owner', {
      listType: 'watchlist',
      resourceId: 42,
      resourceType: 'movie',
    });
    expect(await client.systemLists.memberships({ resourceId: 42, resourceType: 'tv' })).toEqual({
      inWatchlist: true,
      watched: false,
    });
    expect(systemLists.memberships).toHaveBeenCalledWith('owner', {
      resourceId: 42,
      resourceType: 'tv',
    });
    await client.systemLists.page({ listType: 'watched' });
    expect(systemLists.page).toHaveBeenCalledWith('owner', {
      listType: 'watched',
      resourceType: 'movie',
      page: 1,
      providerIds: [],
      region: 'SE',
    });
    await client.systemLists.move({
      listType: 'watchlist',
      resourceType: 'tv',
      itemId,
      position: 20,
    });
    expect(systemLists.move).toHaveBeenCalledWith('owner', {
      listType: 'watchlist',
      resourceType: 'tv',
      itemId,
      position: 20,
    });
    await client.systemLists.options({ region: 'NO' });
    expect(systemLists.options).toHaveBeenCalledWith('owner', { region: 'NO' });
  });
  it('rejects every private workflow with an absent or expired session', async () => {
    const { client, systemLists } = setup(false);
    await expect(client.systemLists.page({ listType: 'watchlist' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    await expect(
      client.systemLists.memberships({ resourceId: 42, resourceType: 'movie' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(
      client.systemLists.toggle({ listType: 'watched', resourceId: 42, resourceType: 'movie' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(
      client.systemLists.move({ listType: 'watched', resourceType: 'movie', itemId, position: 0 }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(client.systemLists.options({ region: 'SE' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    for (const operation of Object.values(systemLists)) {
      expect(operation).not.toHaveBeenCalled();
    }
  });
  it.each([
    { listType: 'custom', resourceId: 42, resourceType: 'movie' },
    { listType: 'watched', resourceId: 42, resourceType: 'person' },
    { listType: 'watched', resourceId: 2_147_483_648, resourceType: 'tv' },
    { listType: 'watchlist', resourceId: -1, resourceType: 'movie' },
  ])('rejects unsupported toggle input %j', async (input) => {
    const { app, systemLists } = setup();
    const response = await app.request('/rpc/systemLists/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: input }),
    });
    expect(response.status).toBe(400);
    expect(systemLists.toggle).not.toHaveBeenCalled();
  });
  it('does not label database failures as empty lists or absent membership', async () => {
    const { client, systemLists } = setup();
    systemLists.page.mockRejectedValue(new Error('database unavailable'));
    systemLists.memberships.mockRejectedValue(new Error('database unavailable'));
    await expect(client.systemLists.page({ listType: 'watchlist' })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
    await expect(
      client.systemLists.memberships({ resourceId: 42, resourceType: 'movie' }),
    ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});
