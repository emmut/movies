import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { delete: vi.fn(), insert: vi.fn() } }));
vi.mock('@/lib/auth-server', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/cache-invalidation', () => ({ revalidateUserWatchlistCache: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/watchlist-list', () => ({
  getWatchlistListId: vi.fn(),
  getOrCreateWatchlistListId: vi.fn(),
}));

import { requireUser } from '@/lib/auth-server';
import { revalidateUserWatchlistCache } from '@/lib/cache-invalidation';
import { db } from '@/lib/db';
import { getOrCreateWatchlistListId, getWatchlistListId } from '@/lib/watchlist-list';
import { revalidatePath } from 'next/cache';

import { chain } from '@/test/db-chain';

import { toggleWatchlist } from './watchlist-actions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ id: 'user-1' } as never);
  // Default: the user already has a watchlist list.
  vi.mocked(getWatchlistListId).mockResolvedValue('list-1');
  vi.mocked(getOrCreateWatchlistListId).mockResolvedValue('list-1');
  // Default: insert returns the new row (the common, uncontended path).
  vi.mocked(db.insert).mockReturnValue(chain([{ id: 'row-1' }]));
});

describe('toggleWatchlist', () => {
  it('removes the item when a row was deleted, without inserting', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([{ id: 'row-1' }]));

    const result = await toggleWatchlist({ resourceId: 5, resourceType: 'movie' });

    expect(result).toEqual({ success: true, action: 'removed' });
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('adds the item when nothing was deleted', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));

    const result = await toggleWatchlist({ resourceId: 5, resourceType: 'tv' });

    expect(result).toEqual({ success: true, action: 'added' });
    expect(db.insert).toHaveBeenCalledTimes(1);
    // The list already existed; no need to create it.
    expect(getOrCreateWatchlistListId).not.toHaveBeenCalled();
  });

  it('creates the watchlist list on first add, skipping the delete', async () => {
    vi.mocked(getWatchlistListId).mockResolvedValue(null);

    const result = await toggleWatchlist({ resourceId: 5, resourceType: 'movie' });

    expect(result).toEqual({ success: true, action: 'added' });
    expect(db.delete).not.toHaveBeenCalled();
    expect(getOrCreateWatchlistListId).toHaveBeenCalledWith('user-1');
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('reports "unchanged" when a concurrent insert won the race (onConflictDoNothing no-op)', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));
    // Insert was suppressed by the conflict: no row returned.
    vi.mocked(db.insert).mockReturnValue(chain([]));

    const result = await toggleWatchlist({ resourceId: 5, resourceType: 'movie' });

    expect(result).toEqual({ success: true, action: 'unchanged' });
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('revalidates the watchlist cache and resource paths', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));

    await toggleWatchlist({ resourceId: 7, resourceType: 'movie' });

    expect(revalidateUserWatchlistCache).toHaveBeenCalledWith('user-1', 'movie', 7);
    expect(revalidatePath).toHaveBeenCalledWith('/movie/7');
    expect(revalidatePath).toHaveBeenCalledWith('/watchlist');
  });

  it('rejects invalid resource ids before touching the database', async () => {
    await expect(toggleWatchlist({ resourceId: 0, resourceType: 'movie' })).rejects.toThrow();
    await expect(
      toggleWatchlist({ resourceId: 1, resourceType: 'person' as never }),
    ).rejects.toThrow();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('wraps database failures in a generic error', async () => {
    vi.mocked(db.delete).mockImplementation(() => {
      throw new Error('connection lost');
    });

    await expect(toggleWatchlist({ resourceId: 1, resourceType: 'movie' })).rejects.toThrow(
      'Failed to update watchlist',
    );
  });
});
