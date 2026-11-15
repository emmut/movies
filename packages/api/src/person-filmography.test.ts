import { describe, expect, it } from 'vite-plus/test';

import {
  getKnownFor,
  personCreditFields,
  type PersonTitle,
  sortPersonTitles,
} from './person-filmography';

function title(id: number, overrides: Partial<PersonTitle> = {}): PersonTitle {
  return {
    id,
    posterUrl: '/poster.jpg',
    type: 'movie',
    genreIds: [],
    popularity: 10,
    releaseDate: '2020-01-01',
    rating: 8,
    voteCount: 1000,
    character: 'Detective',
    ...overrides,
  } as PersonTitle;
}

describe('person filmography', () => {
  it('ranks acting roles ahead of very popular talk, news, reality and self appearances', () => {
    const appearances = [
      title(2, { genreIds: [10767], popularity: 10000 }),
      title(3, { character: 'Self - Guest', popularity: 10000 }),
      title(4, { character: 'Herself (archive footage)' }),
      title(5, { character: 'Host', genreIds: [10767], popularity: 10000 }),
      title(8, { character: 'Himself - Presenter', popularity: 10000 }),
      title(9, { character: 'Themselves - Guest', popularity: 10000 }),
      title(6, { genreIds: [10763] }),
      title(7, { genreIds: [10764] }),
    ];
    expect(sortPersonTitles([...appearances, title(1)])[0].id).toBe(1);
    expect(getKnownFor(appearances)).toEqual([]);
  });

  it.each(['Dinner Guest', 'TV Host', 'Presenter'])(
    'keeps the fictional role "%s" eligible for Known for and relevance ranking',
    (character) => {
      const fictionalRole = title(2, { character, genreIds: [18], popularity: 100 });
      const credits = [title(1), fictionalRole];
      expect(sortPersonTitles(credits)[0]).toEqual(fictionalRole);
      expect(getKnownFor(credits, '2026-01-01')).toEqual([fictionalRole, credits[0]]);
    },
  );

  it('balances ratings with audience size and role prominence', () => {
    expect(sortPersonTitles([title(1, { voteCount: 1, rating: 10 }), title(2)])[0].id).toBe(2);
    expect(sortPersonTitles([title(1, { order: 20 }), title(2, { order: 0 })])[0].id).toBe(2);
  });

  it('uses TV air dates and recurring roles when ranking series', () => {
    function show(id: number, episodes: number, date: string): PersonTitle {
      return {
        id,
        releaseDate: date,
        posterUrl: '/poster.jpg',
        type: 'tv',
        genreIds: [18],
        rating: 8,
        voteCount: 1000,
        popularity: 10,
        character: 'Detective',
        episodeCount: episodes,
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
    const tv = { ...title(1), type: 'tv' as const, releaseDate: '2020-01-01' };
    const input = [movie, tv, movie];
    expect(sortPersonTitles(input)).toHaveLength(2);
    expect(input).toHaveLength(3);
  });

  it('supports rating and newest sorts, including missing dates and ties', () => {
    const input = [
      title(1, { rating: 7 }),
      title(2, { rating: 9, releaseDate: '' }),
      title(3, { releaseDate: '2025-01-01' }),
    ];
    expect(sortPersonTitles(input, 'rating').map((item) => item.id)).toEqual([2, 3, 1]);
    expect(sortPersonTitles(input, 'newest').map((item) => item.id)).toEqual([3, 1, 2]);
    expect(sortPersonTitles([title(2), title(1)], 'rating')[0].id).toBe(1);
    expect(sortPersonTitles([title(2), title(1)], 'newest')[0].id).toBe(1);
  });

  it('selects at most eight released, rated titles with posters and no self appearances', () => {
    const input = Array.from({ length: 10 }, (_, i) => title(i + 1));
    input.push(
      title(11, { releaseDate: '2030-01-01' }),
      title(12, { posterUrl: null }),
      title(13, { voteCount: 0 }),
      title(14, { character: 'Himself' }),
      title(15, { releaseDate: '' }),
    );
    const known = getKnownFor(input, '2026-01-01');
    expect(known).toHaveLength(8);
    expect(known.every((item) => item.id <= 10)).toBe(true);
    expect(getKnownFor([])).toEqual([]);
    expect(sortPersonTitles([])).toEqual([]);
  });
});

it('maps movie and TV credit metadata and tolerates older card-only responses', () => {
  const source = { id: 3, poster_path: '/poster.jpg', vote_average: 8, popularity: 10 };
  expect(
    personCreditFields(
      { ...source, release_date: '2020-01-01', character: 'Hero', order: 2 },
      'movie',
    ),
  ).toMatchObject({
    type: 'movie',
    releaseDate: '2020-01-01',
    character: 'Hero',
    order: 2,
    voteCount: 0,
    genreIds: [],
  });
  expect(
    personCreditFields({ ...source, first_air_date: '2019-01-01', episode_count: 80 }, 'tv'),
  ).toMatchObject({
    type: 'tv',
    releaseDate: '2019-01-01',
    episodeCount: 80,
  });
  const legacy = {
    id: 3,
    type: 'movie' as const,
    posterUrl: '/poster.jpg',
    releaseDate: '',
    rating: 8,
  };
  expect(sortPersonTitles([legacy])).toEqual([legacy]);
  expect(getKnownFor([legacy])).toEqual([]);
});
