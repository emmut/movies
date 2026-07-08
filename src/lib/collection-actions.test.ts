import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { delete: vi.fn(), insert: vi.fn() } }));
vi.mock('@/lib/auth-server', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/cache-invalidation', () => ({ revalidateUserCollectionCache: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth-server';
import { revalidateUserCollectionCache } from '@/lib/cache-invalidation';
import { db } from '@/lib/db';
import { chain } from '@/test/db-chain';

import { toggleCollection } from './collection-actions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ id: 'user-1' } as never);
  // Default: insert returns the new row (the common, uncontended path).
  vi.mocked(db.insert).mockReturnValue(chain([{ id: 'row-1' }]));
});

describe('toggleCollection', () => {
  it('removes the item when a row was deleted, without inserting', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([{ id: 'row-1' }]));

    const result = await toggleCollection({
      collection: 'watchlist',
      resourceId: 5,
      resourceType: 'movie',
    });

    expect(result).toEqual({ success: true, action: 'removed' });
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('adds the item when nothing was deleted', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));

    const result = await toggleCollection({
      collection: 'watched',
      resourceId: 5,
      resourceType: 'tv',
    });

    expect(result).toEqual({ success: true, action: 'added' });
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('reports "unchanged" when a concurrent insert won the race (onConflictDoNothing no-op)', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));
    // Insert was suppressed by the conflict: no row returned.
    vi.mocked(db.insert).mockReturnValue(chain([]));

    const result = await toggleCollection({
      collection: 'watchlist',
      resourceId: 5,
      resourceType: 'movie',
    });

    expect(result).toEqual({ success: true, action: 'unchanged' });
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('revalidates the collection cache, the resource page, and the collection page', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));

    await toggleCollection({ collection: 'watched', resourceId: 7, resourceType: 'movie' });

    expect(revalidateUserCollectionCache).toHaveBeenCalledWith('user-1', 'watched', 'movie', 7);
    expect(revalidatePath).toHaveBeenCalledWith('/movie/7');
    expect(revalidatePath).toHaveBeenCalledWith('/watched');
  });

  it('rejects invalid input before touching the database', async () => {
    await expect(
      toggleCollection({ collection: 'watchlist', resourceId: 0, resourceType: 'movie' }),
    ).rejects.toThrow();
    await expect(
      toggleCollection({ collection: 'favorites', resourceId: 1, resourceType: 'movie' }),
    ).rejects.toThrow();
    await expect(
      toggleCollection({ collection: 'watchlist', resourceId: 1, resourceType: 'person' }),
    ).rejects.toThrow();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('wraps database failures in a collection-specific error', async () => {
    vi.mocked(db.delete).mockImplementation(() => {
      throw new Error('connection lost');
    });

    await expect(
      toggleCollection({ collection: 'watchlist', resourceId: 1, resourceType: 'movie' }),
    ).rejects.toThrow('Failed to update watchlist');
  });
});
