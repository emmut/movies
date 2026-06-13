import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { delete: vi.fn(), insert: vi.fn() } }));
vi.mock('@/lib/auth-server', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/cache-invalidation', () => ({ revalidateUserWatchlistCache: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { requireUser } from '@/lib/auth-server';
import { revalidateUserWatchlistCache } from '@/lib/cache-invalidation';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

import { toggleWatchlist } from './watchlist-actions';

// Builds a fluent query-builder stand-in: every method returns the builder, and
// awaiting it resolves to `result`. Lets us stub arbitrary drizzle chains.
function chain<T>(result: T) {
  const builder = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'then') {
          return (resolve: (v: T) => unknown, reject: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject);
        }
        return () => builder;
      },
    },
  );
  return builder as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ id: 'user-1' } as never);
  vi.mocked(db.insert).mockReturnValue(chain(undefined));
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
