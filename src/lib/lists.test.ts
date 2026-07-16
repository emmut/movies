import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), execute: vi.fn() },
}));
vi.mock('@/lib/auth-server', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/cache-invalidation', () => ({
  revalidateUserListCache: vi.fn(),
  revalidateUserListStatusCache: vi.fn(),
  revalidateUserSystemListPageCache: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/movies', () => ({ getMovieDetails: vi.fn(), getMovieWatchProviders: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({
  getTvShowDetails: vi.fn(),
  getTvShowWatchProviders: vi.fn(),
}));
vi.mock('@/lib/persons', () => ({ getPersonDetails: vi.fn() }));
vi.mock('@/lib/imgproxy-url', () => ({ buildProxyImageUrls: vi.fn(() => undefined) }));
// Run the locked callback against the db mock directly; the real lock needs a
// live transaction and is covered by ordering-lock.test.ts.
vi.mock('@/lib/ordering-lock', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ordering-lock')>();
  const { db } = await import('@/lib/db');
  return {
    ...actual,
    withOrderingLock: vi.fn((_scope: string, fn: (tx: unknown) => unknown) => fn(db)),
  };
});

import { requireUser } from '@/lib/auth-server';
import {
  revalidateUserListCache,
  revalidateUserSystemListPageCache,
} from '@/lib/cache-invalidation';
import { db } from '@/lib/db';
import { getMovieDetails, getMovieWatchProviders } from '@/lib/movies';
import { withOrderingLock } from '@/lib/ordering-lock';
import { getPersonDetails } from '@/lib/persons';
import { chain } from '@/test/db-chain';

import {
  addToList,
  createList,
  deleteList,
  getListDetailsWithResources,
  getOwnedCustomList,
  moveListItem,
  moveList,
  removeFromList,
  updateList,
} from './lists';

const UUID = '123e4567-e89b-12d3-a456-426614174000';

/** Stubs the ownership count query (`db.select`) used by assertListOwnership. */
function setOwnedCount(count: number) {
  vi.mocked(db.select).mockReturnValue(chain([{ count }]));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ id: 'user-1' } as never);
  vi.mocked(db.insert).mockReturnValue(chain(undefined));
  vi.mocked(db.update).mockReturnValue(chain(undefined));
  vi.mocked(db.delete).mockReturnValue(chain(undefined));
  vi.mocked(db.execute).mockResolvedValue(undefined as never);
});

describe('createList', () => {
  it('inserts and returns a generated list id on valid input', async () => {
    const result = await createList('My faves', 'desc', '🎬');
    expect(result.success).toBe(true);
    expect(result.listId).toMatch(/^[0-9a-f-]{36}$/);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('appends under the user’s list-ordering lock so concurrent creates serialize', async () => {
    await createList('My faves');
    expect(withOrderingLock).toHaveBeenCalledWith('lists:user-1', expect.any(Function));
  });

  it('rejects an empty name without inserting', async () => {
    await expect(createList('')).rejects.toThrow();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('rejects a disallowed emoji', async () => {
    await expect(createList('ok', '', '🦄')).rejects.toThrow();
  });
});

describe('ownership enforcement', () => {
  it('addToList throws when the list is not owned by the user', async () => {
    setOwnedCount(0);
    await expect(addToList(UUID, 1, 'movie')).rejects.toThrow('List not found');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('addToList inserts when the list is owned', async () => {
    setOwnedCount(1);
    await addToList(UUID, 1, 'movie');
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(withOrderingLock).toHaveBeenCalledWith(`list-items:${UUID}`, expect.any(Function));
  });

  it('removeFromList throws when the list is not owned', async () => {
    setOwnedCount(0);
    await expect(removeFromList(UUID, 1, 'movie')).rejects.toThrow('List not found');
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('deleteList throws when the list is not owned', async () => {
    setOwnedCount(0);
    await expect(deleteList(UUID)).rejects.toThrow('List not found');
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('deleteList deletes when owned', async () => {
    setOwnedCount(1);
    await deleteList(UUID);
    expect(db.delete).toHaveBeenCalledTimes(1);
  });

  it('updateList throws when not owned', async () => {
    setOwnedCount(0);
    await expect(updateList(UUID, 'name')).rejects.toThrow('List not found');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('updateList updates when owned', async () => {
    setOwnedCount(1);
    await updateList(UUID, 'name');
    expect(db.update).toHaveBeenCalledTimes(1);
  });
});

describe('moveList', () => {
  const OTHER_UUID = '223e4567-e89b-12d3-a456-426614174000';

  it('persists the new order in a single statement when the list is owned', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: OTHER_UUID }, { id: UUID }]));
    await moveList(UUID, 0);
    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(withOrderingLock).toHaveBeenCalledWith('lists:user-1', expect.any(Function));
  });

  it('throws when the list is not among the user’s custom lists', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: OTHER_UUID }]));
    await expect(moveList(UUID, 0)).rejects.toThrow('List not found');
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('rejects a non-uuid list id without querying', async () => {
    await expect(moveList('nope', 0)).rejects.toThrow();
    expect(db.select).not.toHaveBeenCalled();
  });

  it('rejects a negative position without querying', async () => {
    await expect(moveList(UUID, -1)).rejects.toThrow();
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe('moveListItem', () => {
  const OTHER_UUID = '223e4567-e89b-12d3-a456-426614174000';

  it('persists the new order in a single statement when the item is owned', async () => {
    vi.mocked(db.select).mockReturnValue(
      chain([
        { id: OTHER_UUID, listId: UUID, listType: 'custom' },
        { id: UUID, listId: UUID, listType: 'custom' },
      ]),
    );
    await moveListItem(UUID, 0);
    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(withOrderingLock).toHaveBeenCalledWith(`list-items:${UUID}`, expect.any(Function));
  });

  it('throws when the item is not among the user’s custom lists', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));
    await expect(moveListItem(UUID, 0)).rejects.toThrow('Item not found');
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('rejects a non-uuid item id without querying', async () => {
    await expect(moveListItem('nope', 0)).rejects.toThrow();
    expect(db.select).not.toHaveBeenCalled();
  });

  it('rejects a negative position without querying', async () => {
    await expect(moveListItem(UUID, -1)).rejects.toThrow();
    expect(db.select).not.toHaveBeenCalled();
  });

  it('revalidates the system list cache (not the custom cache) for a system list item', async () => {
    vi.mocked(db.select).mockReturnValue(
      chain([
        { id: UUID, listId: UUID, listType: 'watchlist' },
        { id: UUID, listId: UUID, listType: 'watchlist' },
      ]),
    );
    await moveListItem(UUID, 0, 'movie');
    expect(revalidateUserSystemListPageCache).toHaveBeenCalledWith('user-1', 'watchlist');
    expect(revalidateUserListCache).not.toHaveBeenCalled();
  });
});

describe('getListDetailsWithResources with a provider filter', () => {
  const list = {
    id: UUID,
    userId: 'user-1',
    type: 'custom',
    name: 'My list',
    description: null,
    emoji: '📝',
    position: 1,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };

  const itemRows = [
    { id: 'item-1', listId: UUID, resourceId: 1, resourceType: 'movie', position: 1, createdAt: new Date(0) },
    { id: 'item-2', listId: UUID, resourceId: 2, resourceType: 'movie', position: 2, createdAt: new Date(0) },
    { id: 'item-3', listId: UUID, resourceId: 3, resourceType: 'person', position: 3, createdAt: new Date(0) },
  ];

  beforeEach(() => {
    vi.mocked(getMovieDetails).mockImplementation(
      async (movieId: number) => ({ id: movieId, poster_path: null }) as never,
    );
    // Movie 1 streams on provider 8 in SE; movie 2 streams nowhere.
    vi.mocked(getMovieWatchProviders).mockImplementation(async (movieId: number) => ({
      results:
        movieId === 1
          ? {
              SE: {
                link: 'https://tmdb',
                flatrate: [
                  { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png', display_priority: 1 },
                ],
              },
            }
          : {},
    }));
  });

  it('keeps only streamable items while itemCount stays the unfiltered total', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([list]))
      .mockReturnValueOnce(chain(itemRows));

    const result = await getListDetailsWithResources(UUID, 1, [8], 'SE');

    expect(result.allItems.map((item) => item.id)).toEqual([1]);
    expect(result.totalItems).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.itemCount).toBe(3);
    // Person rows never match a stream-provider filter, so no person lookup runs.
    expect(getPersonDetails).not.toHaveBeenCalled();
  });

  it('returns an empty page but a non-zero itemCount when nothing matches', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([list]))
      .mockReturnValueOnce(chain(itemRows));

    const result = await getListDetailsWithResources(UUID, 1, [999], 'SE');

    expect(result.allItems).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.itemCount).toBe(3);
  });

  it('rejects an unknown watch region before querying', async () => {
    await expect(getListDetailsWithResources(UUID, 1, [8], 'XX')).rejects.toThrow();
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe('getOwnedCustomList', () => {
  it('returns the list when it is an owned custom list', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: UUID }]));
    await expect(getOwnedCustomList(UUID)).resolves.toEqual({ id: UUID });
  });

  it('returns null when the list is missing, foreign, or a system list', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));
    await expect(getOwnedCustomList(UUID)).resolves.toBeNull();
  });

  it('returns null for a non-uuid id without querying', async () => {
    await expect(getOwnedCustomList('not-a-uuid')).resolves.toBeNull();
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe('input validation', () => {
  it('rejects a non-uuid list id in deleteList before querying', async () => {
    await expect(deleteList('not-a-uuid')).rejects.toThrow('Invalid list ID');
    expect(db.select).not.toHaveBeenCalled();
  });

  it('rejects a bad media id in addToList', async () => {
    await expect(addToList(UUID, 0, 'movie')).rejects.toThrow();
  });

  it('rejects an unknown media type in addToList', async () => {
    await expect(addToList(UUID, 1, 'audio' as never)).rejects.toThrow();
  });

  it('maps unique-constraint violations to a friendly error', async () => {
    setOwnedCount(1);
    vi.mocked(db.insert).mockReturnValue({
      values: () => Promise.reject(new Error('duplicate key value violates unique constraint')),
    } as never);
    await expect(addToList(UUID, 1, 'movie')).rejects.toThrow('Item already in list');
  });
});
