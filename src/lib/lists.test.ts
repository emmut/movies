import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/lib/auth-server', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/cache-invalidation', () => ({
  revalidateUserListCache: vi.fn(),
  revalidateUserListStatusCache: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { requireUser } from '@/lib/auth-server';
import { db } from '@/lib/db';

import { addToList, createList, deleteList, removeFromList, updateList } from './lists';

const UUID = '123e4567-e89b-12d3-a456-426614174000';

// Awaiting any method chain resolves to `result`; intermediate calls return self.
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
});

describe('createList', () => {
  it('inserts and returns a generated list id on valid input', async () => {
    const result = await createList('My faves', 'desc', '🎬');
    expect(result.success).toBe(true);
    expect(result.listId).toMatch(/^[0-9a-f-]{36}$/);
    expect(db.insert).toHaveBeenCalledTimes(1);
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
