import { TmdbRequestError } from '@movies/api/tmdb-fetch';
import { createPersonService } from '@server/person-service';
import { describe, expect, it, vi } from 'vite-plus/test';

const person = {
  id: 7,
  name: 'A person',
  biography: 'A biography',
  profile_path: null,
  birthday: '1970-01-01',
  deathday: null,
  place_of_birth: 'Stockholm, Sweden',
  known_for_department: 'Acting',
  also_known_as: ['Another name'],
  popularity: 8.2,
  homepage: 'https://example.com',
  imdb_id: 'nm0000007',
};
describe('native person catalog', () => {
  it('normalizes public facts, handles absent profile and constructs validated source links', async () => {
    const fetcher = vi.fn().mockResolvedValue(person);
    expect(await createPersonService(fetcher).details({ id: 7 })).toEqual({
      id: 7,
      name: 'A person',
      biography: 'A biography',
      profileUrl: null,
      birthday: '1970-01-01',
      deathday: null,
      birthplace: 'Stockholm, Sweden',
      department: 'Acting',
      aliases: ['Another name'],
      popularity: 8.2,
      homepage: 'https://example.com/',
      imdbUrl: 'https://www.imdb.com/name/nm0000007/',
    });
  });
  it.each(['javascript:alert(1)', 'not a URL', null])(
    'omits unsafe or unavailable external links %s',
    async (homepage) => {
      const fetcher = vi.fn().mockResolvedValue({ ...person, homepage, imdb_id: 'invalid' });
      expect(await createPersonService(fetcher).details({ id: 7 })).toMatchObject({
        homepage: null,
        imdbUrl: null,
      });
    },
  );
  it('maps 404 to native not-found and preserves other upstream failures', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TmdbRequestError('Missing', 404))
      .mockRejectedValueOnce(new Error('offline'));
    await expect(createPersonService(fetcher).details({ id: 7 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(createPersonService(fetcher).details({ id: 7 })).rejects.toThrow('offline');
  });
  it('deduplicates first occurrences and preserves web popularity/date ordering', async () => {
    const cast = [
      { id: 1, title: 'First', popularity: 1, release_date: '2020-01-01' },
      { id: 1, title: 'Duplicate', popularity: 100 },
      { id: 2, title: 'Popular', popularity: 2, release_date: '2010-01-01' },
      { id: 3, title: 'Recent', popularity: 2, release_date: '2025-01-01' },
    ];
    const fetcher = vi.fn().mockResolvedValue({ cast });
    const result = await createPersonService(fetcher).credits({ id: 7, type: 'movie' });
    expect(result.map((item) => item.title)).toEqual(['Recent', 'Popular', 'First']);
    expect(result.every((item) => item.type === 'movie')).toBe(true);
  });
  it('normalizes TV credits and rejects malformed supporting records for independent retry', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ cast: [{ id: 12, name: 'Series', vote_average: 7.5 }] })
      .mockResolvedValueOnce({ cast: [{ id: -1 }] });
    expect((await createPersonService(fetcher).credits({ id: 7, type: 'tv' }))[0]).toMatchObject({
      type: 'tv',
      title: 'Series',
      rating: 7.5,
    });
    await expect(createPersonService(fetcher).credits({ id: 7, type: 'movie' })).rejects.toThrow();
  });
});
