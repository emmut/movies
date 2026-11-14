import { describe, expect, it, vi } from 'vite-plus/test';

import { createImdbRatingStore } from './imdb-ratings';

function fixture(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const database = {
    select: vi.fn().mockReturnValue({ from: () => ({ where: () => ({ limit }) }) }),
  };
  return { database, store: createImdbRatingStore(database as never) };
}

describe('shared IMDb rating reads', () => {
  it('normalizes the numeric column without dropping zero ratings or votes', async () => {
    expect(await fixture([{ rating: '8.7', numVotes: 2400000 }]).store.read('tt0816692')).toEqual({
      rating: 8.7,
      numVotes: 2400000,
    });
    expect(await fixture([{ rating: '0.0', numVotes: 0 }]).store.read('tt0000001')).toEqual({
      rating: 0,
      numVotes: 0,
    });
  });
  it('returns null for a missing ingested row', async () => {
    expect(await fixture([]).store.read('tt9999999')).toBeNull();
  });
  it.each(['', 'tt1', 'nm0000123', 'tt0816692/../../other', 'javascript:alert(1)'])(
    'never queries an invalid title ID: %s',
    async (id) => {
      const { database, store } = fixture([]);
      expect(await store.read(id)).toBeNull();
      expect(database.select).not.toHaveBeenCalled();
    },
  );
  it.each([
    { rating: 'NaN', numVotes: 1 },
    { rating: '11', numVotes: 1 },
    { rating: '8.7', numVotes: -1 },
  ])('rejects corrupt stored values: %j', async (row) => {
    await expect(fixture([row]).store.read('tt0816692')).rejects.toThrow();
  });
  it('lets each host handle database failures instead of returning a false miss', async () => {
    const database = {
      select: vi.fn().mockImplementation(() => {
        throw new Error('database unavailable');
      }),
    };
    await expect(createImdbRatingStore(database as never).read('tt0816692')).rejects.toThrow(
      'database unavailable',
    );
  });
});
