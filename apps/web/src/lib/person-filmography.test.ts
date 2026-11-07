import { describe, expect, it } from 'vite-plus/test';

import { getKnownFor, type PersonTitle, sortPersonTitles } from './person-filmography';

function title(id: number, overrides: Partial<PersonTitle> = {}): PersonTitle {
  return {
    id,
    title: `Movie ${id}`,
    original_title: '',
    adult: false,
    backdrop_path: '',
    original_language: 'en',
    overview: '',
    poster_path: '/poster.jpg',
    media_type: 'movie',
    genre_ids: [],
    popularity: 10,
    release_date: '2020-01-01',
    video: false,
    vote_average: 8,
    vote_count: 1000,
    character: 'Detective',
    ...overrides,
  } as PersonTitle;
}

describe('person filmography', () => {
  it('ranks acting roles ahead of very popular talk, news, reality and self appearances', () => {
    const appearances = [
      title(2, { genre_ids: [10767], popularity: 10000 }),
      title(3, { character: 'Self - Guest', popularity: 10000 }),
      title(4, { character: 'Herself (archive footage)' }),
      title(5, { character: 'Host' }),
      title(6, { genre_ids: [10763] }),
      title(7, { genre_ids: [10764] }),
    ];
    expect(sortPersonTitles([...appearances, title(1)])[0].id).toBe(1);
  });

  it('balances ratings with audience size and role prominence', () => {
    expect(sortPersonTitles([title(1, { vote_count: 1, vote_average: 10 }), title(2)])[0].id).toBe(
      2,
    );
    expect(sortPersonTitles([title(1, { order: 20 }), title(2, { order: 0 })])[0].id).toBe(2);
  });

  it('uses TV air dates and recurring roles when ranking series', () => {
    function show(id: number, episodes: number, date: string): PersonTitle {
      return {
        id,
        name: `Show ${id}`,
        original_name: '',
        first_air_date: date,
        origin_country: [],
        original_language: 'en',
        overview: '',
        backdrop_path: '',
        poster_path: '/poster.jpg',
        media_type: 'tv',
        genre_ids: [18],
        vote_average: 8,
        vote_count: 1000,
        popularity: 10,
        character: 'Detective',
        episode_count: episodes,
      };
    }
    const guestRole = show(1, 1, '2025-01-01');
    const regularRole = show(2, 80, '2010-01-01');
    expect(sortPersonTitles([guestRole, regularRole])[0].id).toBe(2);
    expect(sortPersonTitles([regularRole, guestRole], 'newest')[0].id).toBe(1);
    expect(getKnownFor([regularRole], '2020-01-01')).toEqual([regularRole]);
  });

  it('does not mistake a character named Selfridge for a self appearance', () => {
    expect(getKnownFor([title(1, { character: 'Harry Selfridge' })])).toHaveLength(1);
  });

  it('deduplicates titles without merging movie and TV ids or mutating input', () => {
    const movie = title(1);
    const tv = { ...title(1), media_type: 'tv', name: 'Show', first_air_date: '2020-01-01' };
    const input = [movie, tv, movie];
    expect(sortPersonTitles(input)).toHaveLength(2);
    expect(input).toHaveLength(3);
  });

  it('supports rating and newest sorts, including missing dates and ties', () => {
    const input = [
      title(1, { vote_average: 7 }),
      title(2, { vote_average: 9, release_date: '' }),
      title(3, { release_date: '2025-01-01' }),
    ];
    expect(sortPersonTitles(input, 'rating').map((item) => item.id)).toEqual([2, 3, 1]);
    expect(sortPersonTitles(input, 'newest').map((item) => item.id)).toEqual([3, 1, 2]);
    expect(sortPersonTitles([title(2), title(1)], 'rating')[0].id).toBe(1);
    expect(sortPersonTitles([title(2), title(1)], 'newest')[0].id).toBe(1);
  });

  it('selects at most eight released, rated titles with posters and no self appearances', () => {
    const input = Array.from({ length: 10 }, (_, i) => title(i + 1));
    input.push(
      title(11, { release_date: '2030-01-01' }),
      title(12, { poster_path: null }),
      title(13, { vote_count: 0 }),
      title(14, { character: 'Himself' }),
      title(15, { release_date: '' }),
    );
    const known = getKnownFor(input, '2026-01-01');
    expect(known).toHaveLength(8);
    expect(known.every((item) => item.id <= 10)).toBe(true);
    expect(getKnownFor([])).toEqual([]);
    expect(sortPersonTitles([])).toEqual([]);
  });
});
