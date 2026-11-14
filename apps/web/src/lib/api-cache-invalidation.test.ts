import type { AppContext } from '@movies/api/router';
import { revalidatePath } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { invalidateApiMutation } from './api-cache-invalidation';
import {
  revalidateUserPreferenceCache,
  revalidateUserListCache,
  revalidateUserListStatusCache,
  revalidateUserSystemListCache,
} from './cache-invalidation';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('./cache-invalidation', () => ({
  revalidateUserPreferenceCache: vi.fn(),
  revalidateUserListCache: vi.fn(),
  revalidateUserListStatusCache: vi.fn(),
  revalidateUserSystemListCache: vi.fn(),
  revalidateUserSystemListPageCache: vi.fn(),
}));
const current = vi.fn();
const context = { session: { current } } as unknown as AppContext;
beforeEach(() => {
  vi.clearAllMocks();
  current.mockResolvedValue({ id: 'verified-account' });
});

describe('RPC mutation render-cache invalidation', () => {
  it('uses the verified account for preference invalidation', async () => {
    await invalidateApiMutation(
      '/preferences/setRegion',
      { userId: 'spoofed', region: 'US' },
      context,
    );
    expect(revalidateUserPreferenceCache).toHaveBeenCalledWith('verified-account');
    expect(revalidatePath).toHaveBeenCalledWith('/discover');
  });
  it('refreshes custom list details, membership and index after writes', async () => {
    await invalidateApiMutation(
      '/customLists/add',
      { listId: 'list', resourceType: 'movie', resourceId: 42 },
      context,
    );
    expect(revalidateUserListCache).toHaveBeenCalledWith('verified-account', 'list');
    expect(revalidateUserListStatusCache).toHaveBeenCalledWith('verified-account', 'movie', 42);
    expect(revalidatePath).toHaveBeenCalledWith('/lists/[id]', 'page');
  });
  it('refreshes the title and system-list pages after a toggle', async () => {
    await invalidateApiMutation(
      '/systemLists/toggle',
      { listType: 'watched', resourceType: 'tv', resourceId: 7 },
      context,
    );
    expect(revalidateUserSystemListCache).toHaveBeenCalledWith(
      'verified-account',
      'watched',
      'tv',
      7,
    );
    expect(revalidatePath).toHaveBeenCalledWith('/tv/7');
  });
  it('does not invalidate private render state without a verified session', async () => {
    current.mockResolvedValue(null);
    await invalidateApiMutation('/preferences/setRegion', {}, context);
    expect(revalidateUserPreferenceCache).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
