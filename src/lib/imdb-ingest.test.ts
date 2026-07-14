import { describe, expect, it, vi } from 'vitest';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { parseRatingRecord, upsertRatingsBatch } from './imdb-ingest';

describe('parseRatingRecord', () => {
  it('parses a valid record', () => {
    expect(
      parseRatingRecord({ tconst: 'tt0111161', averageRating: '9.3', numVotes: '3021762' }),
    ).toEqual({ imdbId: 'tt0111161', rating: '9.3', numVotes: 3021762 });
  });

  it('rejects a blank averageRating', () => {
    expect(parseRatingRecord({ tconst: 'tt0111161', averageRating: '', numVotes: '10' })).toBeNull();
  });

  it('rejects a blank numVotes', () => {
    expect(parseRatingRecord({ tconst: 'tt0111161', averageRating: '9.3', numVotes: '' })).toBeNull();
  });

  it('rejects \\N null markers', () => {
    expect(
      parseRatingRecord({ tconst: 'tt0111161', averageRating: '\\N', numVotes: '\\N' }),
    ).toBeNull();
  });

  it('rejects a non-integer vote count', () => {
    expect(
      parseRatingRecord({ tconst: 'tt0111161', averageRating: '9.3', numVotes: '10.5' }),
    ).toBeNull();
  });

  it('rejects a missing tconst', () => {
    expect(parseRatingRecord({ averageRating: '9.3', numVotes: '10' })).toBeNull();
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
