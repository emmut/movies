import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth-server', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/cache-invalidation', () => ({ revalidateUserSystemListCache: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/system-list', () => ({
  toggleSystemListRow: vi.fn(),
  removeSystemListRow: vi.fn(),
}));

import { requireUser } from '@/lib/auth-server';
import { revalidateUserSystemListCache } from '@/lib/cache-invalidation';
import { removeSystemListRow, toggleSystemListRow } from '@/lib/system-list';
import { revalidatePath } from 'next/cache';

import { toggleSystemListItem } from './system-list-actions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ id: 'user-1' } as never);
  vi.mocked(toggleSystemListRow).mockResolvedValue('added');
  vi.mocked(removeSystemListRow).mockResolvedValue(false);
});

describe('toggleSystemListItem', () => {
  it('toggles the row and reports the resulting action', async () => {
    vi.mocked(toggleSystemListRow).mockResolvedValue('removed');

    const result = await toggleSystemListItem({
      listType: 'watchlist',
      resourceId: 5,
      resourceType: 'movie',
    });

    expect(result).toEqual({ success: true, action: 'removed' });
    expect(toggleSystemListRow).toHaveBeenCalledWith('user-1', 'watchlist', 5, 'movie');
  });

  it('revalidates the list cache and resource paths', async () => {
    await toggleSystemListItem({ listType: 'watchlist', resourceId: 7, resourceType: 'movie' });

    expect(revalidateUserSystemListCache).toHaveBeenCalledWith('user-1', 'watchlist', 'movie', 7);
    expect(revalidatePath).toHaveBeenCalledWith('/movie/7');
    expect(revalidatePath).toHaveBeenCalledWith('/watchlist');
  });

  it('does not touch the watchlist when toggling watchlist items', async () => {
    await toggleSystemListItem({ listType: 'watchlist', resourceId: 5, resourceType: 'movie' });

    expect(removeSystemListRow).not.toHaveBeenCalled();
  });

  it('removes a freshly watched item from the watchlist', async () => {
    vi.mocked(toggleSystemListRow).mockResolvedValue('added');
    vi.mocked(removeSystemListRow).mockResolvedValue(true);

    const result = await toggleSystemListItem({
      listType: 'watched',
      resourceId: 5,
      resourceType: 'tv',
    });

    expect(result).toEqual({ success: true, action: 'added' });
    expect(removeSystemListRow).toHaveBeenCalledWith('user-1', 'watchlist', 5, 'tv');
    // Both the watched and the watchlist caches must refresh.
    expect(revalidateUserSystemListCache).toHaveBeenCalledWith('user-1', 'watched', 'tv', 5);
    expect(revalidateUserSystemListCache).toHaveBeenCalledWith('user-1', 'watchlist', 'tv', 5);
    expect(revalidatePath).toHaveBeenCalledWith('/watchlist');
    expect(revalidatePath).toHaveBeenCalledWith('/watched');
  });

  it('skips watchlist revalidation when the watched item was not on the watchlist', async () => {
    vi.mocked(toggleSystemListRow).mockResolvedValue('added');
    vi.mocked(removeSystemListRow).mockResolvedValue(false);

    await toggleSystemListItem({ listType: 'watched', resourceId: 5, resourceType: 'movie' });

    expect(removeSystemListRow).toHaveBeenCalledTimes(1);
    expect(revalidateUserSystemListCache).toHaveBeenCalledTimes(1);
    expect(revalidatePath).not.toHaveBeenCalledWith('/watchlist');
  });

  it('does not remove from the watchlist when un-marking watched', async () => {
    vi.mocked(toggleSystemListRow).mockResolvedValue('removed');

    await toggleSystemListItem({ listType: 'watched', resourceId: 5, resourceType: 'movie' });

    expect(removeSystemListRow).not.toHaveBeenCalled();
  });

  it('rejects invalid input before touching the database', async () => {
    await expect(
      toggleSystemListItem({ listType: 'watchlist', resourceId: 0, resourceType: 'movie' }),
    ).rejects.toThrow();
    await expect(
      toggleSystemListItem({ listType: 'favorites' as never, resourceId: 1, resourceType: 'movie' }),
    ).rejects.toThrow();
    expect(toggleSystemListRow).not.toHaveBeenCalled();
  });

  it('wraps database failures in a generic error', async () => {
    vi.mocked(toggleSystemListRow).mockRejectedValue(new Error('connection lost'));

    await expect(
      toggleSystemListItem({ listType: 'watchlist', resourceId: 1, resourceType: 'movie' }),
    ).rejects.toThrow('Failed to update watchlist');
  });
});
