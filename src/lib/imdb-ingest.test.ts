import { describe, expect, it, vi } from 'vitest';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { parseRatingLine, upsertRatingsBatch } from './imdb-ingest';

describe('parseRatingLine', () => {
  it('parses a valid ratings row', () => {
    expect(parseRatingLine('tt0111161\t9.3\t3021762')).toEqual({
      imdbId: 'tt0111161',
      rating: '9.3',
      numVotes: 3021762,
    });
  });

  it('skips the header row', () => {
    expect(parseRatingLine('tconst\taverageRating\tnumVotes')).toBeNull();
  });

  it('skips rows with the wrong number of columns', () => {
    expect(parseRatingLine('')).toBeNull();
    expect(parseRatingLine('tt0111161\t9.3')).toBeNull();
    expect(parseRatingLine('tt0111161\t9.3\t100\textra')).toBeNull();
  });

  it('skips rows with non-numeric rating or votes', () => {
    expect(parseRatingLine('tt0111161\t\\N\t100')).toBeNull();
    expect(parseRatingLine('tt0111161\t9.3\t\\N')).toBeNull();
    expect(parseRatingLine('tt0111161\t9.3\t10.5')).toBeNull();
  });

  it('skips rows with blank votes field', () => {
    expect(parseRatingLine('tt0111161\t9.0\t')).toBeNull();
  });
});

describe('upsertRatingsBatch', () => {
  function mockDatabase() {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    const insert = vi.fn().mockReturnValue({ values });
    return { database: { insert } as unknown as NodePgDatabase, insert, values, onConflictDoUpdate };
  }

  it('does nothing for an empty batch', async () => {
    const { database, insert } = mockDatabase();
    await upsertRatingsBatch(database, []);
    expect(insert).not.toHaveBeenCalled();
  });

  it('upserts the batch on the imdb_id primary key', async () => {
    const { database, insert, values, onConflictDoUpdate } = mockDatabase();
    const rows = [{ imdbId: 'tt0111161', rating: '9.3', numVotes: 3021762 }];

    await upsertRatingsBatch(database, rows);

    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(rows);
    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({ rating: expect.anything(), numVotes: expect.anything() }),
      }),
    );
  });
});
