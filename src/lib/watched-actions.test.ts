import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { delete: vi.fn(), insert: vi.fn() } }));
vi.mock('@/lib/auth-server', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/cache-invalidation', () => ({ revalidateUserWatchedCache: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/watched-list', () => ({
  getWatchedListId: vi.fn(),
  getOrCreateWatchedListId: vi.fn(),
}));

import { requireUser } from '@/lib/auth-server';
import { revalidateUserWatchedCache } from '@/lib/cache-invalidation';
import { db } from '@/lib/db';
import { getOrCreateWatchedListId, getWatchedListId } from '@/lib/watched-list';
import { revalidatePath } from 'next/cache';

import { chain } from '@/test/db-chain';

import { toggleWatched } from './watched-actions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ id: 'user-1' } as never);
  // Default: the user already has a watched list.
  vi.mocked(getWatchedListId).mockResolvedValue('list-1');
  vi.mocked(getOrCreateWatchedListId).mockResolvedValue('list-1');
  // Default: insert returns the new row (the common, uncontended path).
  vi.mocked(db.insert).mockReturnValue(chain([{ id: 'row-1' }]));
});

describe('toggleWatched', () => {
  it('removes the item when a row was deleted, without inserting', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([{ id: 'row-1' }]));

    const result = await toggleWatched({ resourceId: 5, resourceType: 'movie' });

    expect(result).toEqual({ success: true, action: 'removed' });
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('adds the item when nothing was deleted', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));

    const result = await toggleWatched({ resourceId: 5, resourceType: 'tv' });

    expect(result).toEqual({ success: true, action: 'added' });
    expect(db.insert).toHaveBeenCalledTimes(1);
    // The list already existed; no need to create it.
    expect(getOrCreateWatchedListId).not.toHaveBeenCalled();
  });

  it('creates the watched list on first add, skipping the delete', async () => {
    vi.mocked(getWatchedListId).mockResolvedValue(null);

    const result = await toggleWatched({ resourceId: 5, resourceType: 'movie' });

    expect(result).toEqual({ success: true, action: 'added' });
    expect(db.delete).not.toHaveBeenCalled();
    expect(getOrCreateWatchedListId).toHaveBeenCalledWith('user-1');
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('reports "unchanged" when a concurrent insert won the race (onConflictDoNothing no-op)', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));
    // Insert was suppressed by the conflict: no row returned.
    vi.mocked(db.insert).mockReturnValue(chain([]));

    const result = await toggleWatched({ resourceId: 5, resourceType: 'movie' });

    expect(result).toEqual({ success: true, action: 'unchanged' });
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('revalidates the watched cache and resource paths', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));

    await toggleWatched({ resourceId: 7, resourceType: 'movie' });

    expect(revalidateUserWatchedCache).toHaveBeenCalledWith('user-1', 'movie', 7);
    expect(revalidatePath).toHaveBeenCalledWith('/movie/7');
    expect(revalidatePath).toHaveBeenCalledWith('/watched');
  });

  it('rejects invalid resource ids before touching the database', async () => {
    await expect(toggleWatched({ resourceId: 0, resourceType: 'movie' })).rejects.toThrow();
    await expect(
      toggleWatched({ resourceId: 1, resourceType: 'person' as never }),
    ).rejects.toThrow();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('wraps database failures in a generic error', async () => {
    vi.mocked(db.delete).mockImplementation(() => {
      throw new Error('connection lost');
    });

    await expect(toggleWatched({ resourceId: 1, resourceType: 'movie' })).rejects.toThrow(
      'Failed to update watched history',
    );
  });
});
