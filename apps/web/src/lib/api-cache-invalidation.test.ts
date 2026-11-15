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
beforeEach(() => vi.clearAllMocks());

describe('RPC mutation render-cache invalidation', () => {
  it('uses the verified account for preference invalidation', async () => {
    await invalidateApiMutation({ domain: 'preferences', userId: 'verified-account' });
    expect(revalidateUserPreferenceCache).toHaveBeenCalledWith('verified-account');
    expect(revalidatePath).toHaveBeenCalledWith('/discover');
  });
  it('refreshes custom list details, membership and index after writes', async () => {
    await invalidateApiMutation({
      domain: 'customLists',
      userId: 'verified-account',
      listId: 'list',
      resource: { resourceType: 'movie', resourceId: 42 },
    });
    expect(revalidateUserListCache).toHaveBeenCalledWith('verified-account', 'list');
    expect(revalidateUserListStatusCache).toHaveBeenCalledWith('verified-account', 'movie', 42);
    expect(revalidatePath).toHaveBeenCalledWith('/lists/[id]', 'page');
  });
  it('refreshes the title and system-list pages after a toggle', async () => {
    await invalidateApiMutation({
      domain: 'systemLists',
      userId: 'verified-account',
      listType: 'watched',
      resource: { resourceType: 'tv', resourceId: 7 },
    });
    expect(revalidateUserSystemListCache).toHaveBeenCalledWith(
      'verified-account',
      'watched',
      'tv',
      7,
    );
    expect(revalidatePath).toHaveBeenCalledWith('/tv/7');
  });
  it('invalidates collection pages without inventing resource membership changes', () => {
    invalidateApiMutation({ domain: 'customLists', userId: 'verified-account' });
    expect(revalidateUserListCache).toHaveBeenCalledWith('verified-account', undefined);
    expect(revalidateUserListStatusCache).not.toHaveBeenCalled();
  });
});
