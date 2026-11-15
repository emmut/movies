import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const memberships = vi.hoisted(() => vi.fn());
const getUser = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api-server', () => ({
  createServerApi: () => ({ systemLists: { memberships } }),
}));
vi.mock('@/lib/auth-server', () => ({ getUser }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));

import { getSystemListMemberships } from './system-list-memberships';

beforeEach(() => vi.resetAllMocks());

describe('getSystemListMemberships', () => {
  it('returns no memberships for signed-out visitors without calling the API', async () => {
    getUser.mockResolvedValue(null);

    await expect(getSystemListMemberships(7, 'movie')).resolves.toEqual({
      inWatchlist: false,
      watched: false,
    });
    expect(memberships).not.toHaveBeenCalled();
  });

  it('reads memberships for signed-in users', async () => {
    getUser.mockResolvedValue({ id: 'user-1' });
    memberships.mockResolvedValue({ inWatchlist: true, watched: false });

    await expect(getSystemListMemberships(7, 'tv')).resolves.toEqual({
      inWatchlist: true,
      watched: false,
    });
    expect(memberships).toHaveBeenCalledWith({ resourceId: 7, resourceType: 'tv' });
  });
});
