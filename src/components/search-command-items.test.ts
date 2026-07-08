import { describe, expect, it } from 'vitest';

import type { SearchMultiResult } from '@/lib/search';

import {
  buildSeeAllHref,
  getSubmitHref,
  moveSelection,
  toSearchCommandItems,
} from './search-command-items';

type MultiResult = SearchMultiResult['results'][number];

const imageUrls = { src: 'src', srcSetAvif: 'avif', srcSetWebp: 'webp' };

function multiResult(results: MultiResult[]): SearchMultiResult {
  return { results, totalPages: 1 };
}

function movie(overrides: Partial<MultiResult> = {}): MultiResult {
  return {
    id: 1,
    media_type: 'movie',
    title: 'Heat',
    release_date: '1995-12-15',
    poster_path: '/heat.jpg',
    ...overrides,
  } as MultiResult;
}

describe('toSearchCommandItems', () => {
  it('maps a movie to a palette row', () => {
    const [item] = toSearchCommandItems(
      multiResult([movie({ posterImageUrls: imageUrls } as never)]),
    );

    expect(item).toEqual({
      key: 'movie-1',
      href: '/movie/1',
      title: 'Heat',
      subtitle: '1995',
      badge: 'Movie',
      badgeVariant: 'yellow',
      imageUrls,
      fallbackSrc: expect.stringContaining('/heat.jpg'),
      fallbackEmoji: '🎬',
    });
  });

  it('maps a tv show to a palette row', () => {
    const [item] = toSearchCommandItems(
      multiResult([
        {
          id: 2,
          media_type: 'tv',
          name: 'The Office',
          first_air_date: '2005-03-24',
          poster_path: null,
        } as MultiResult,
      ]),
    );

    expect(item).toMatchObject({
      key: 'tv-2',
      href: '/tv/2',
      title: 'The Office',
      subtitle: '2005',
      badge: 'TV Show',
      badgeVariant: 'red',
      fallbackSrc: '',
    });
  });

  it('maps a person to a palette row', () => {
    const [item] = toSearchCommandItems(
      multiResult([
        {
          id: 3,
          media_type: 'person',
          name: 'Keanu Reeves',
          known_for_department: 'Acting',
          profile_path: '/keanu.jpg',
        } as MultiResult,
      ]),
    );

    expect(item).toMatchObject({
      key: 'person-3',
      href: '/person/3',
      title: 'Keanu Reeves',
      subtitle: 'Acting',
      badge: 'Person',
      badgeVariant: 'blue',
    });
  });

  it('leaves the subtitle empty when dates are missing', () => {
    const [item] = toSearchCommandItems(multiResult([movie({ release_date: '' })]));
    expect(item.subtitle).toBe('');
  });

  it('drops unsupported media types', () => {
    const items = toSearchCommandItems(
      multiResult([{ id: 4, media_type: 'collection' } as unknown as MultiResult, movie()]),
    );

    expect(items).toHaveLength(1);
    expect(items[0].key).toBe('movie-1');
  });

  it('caps the list at the given limit', () => {
    const results = Array.from({ length: 12 }, (_, index) => movie({ id: index + 1 }));
    expect(toSearchCommandItems(multiResult(results))).toHaveLength(8);
    expect(toSearchCommandItems(multiResult(results), 3)).toHaveLength(3);
  });

  it('returns an empty list while no data has loaded', () => {
    expect(toSearchCommandItems(undefined)).toEqual([]);
  });
});

describe('buildSeeAllHref', () => {
  it('defaults to the all tab', () => {
    expect(buildSeeAllHref('heat')).toBe('/search?q=heat&mediaType=all');
  });

  it('preselects the tab for a media-type keyword', () => {
    expect(buildSeeAllHref('heat movie')).toBe('/search?q=heat%20movie&mediaType=movie');
    expect(buildSeeAllHref('the office tv show')).toBe(
      '/search?q=the%20office%20tv%20show&mediaType=tv',
    );
    expect(buildSeeAllHref('brad pitt person')).toBe(
      '/search?q=brad%20pitt%20person&mediaType=person',
    );
  });
});

describe('getSubmitHref', () => {
  const items = toSearchCommandItems(multiResult([movie(), movie({ id: 2 })]));
  const seeAll = '/search?q=matrix';

  it('opens the selected row when results are fresh', () => {
    expect(getSubmitHref(items, 1, true, seeAll, true)).toBe('/movie/2');
  });

  // ⌘/Ctrl+Enter passes canOpenRow=false to force the full search page.
  it('goes to the full search page when row-opening is suppressed', () => {
    expect(getSubmitHref(items, 1, false, seeAll, true)).toBe(seeAll);
  });

  // Regression: with keepPreviousData, Enter during the debounce/fetch of a
  // new query used to open a row from the previous query's stale results.
  it('goes to the full search page instead of a stale row', () => {
    expect(getSubmitHref(items, 0, false, seeAll, true)).toBe(seeAll);
  });

  it('goes to the full search page when there are no rows yet', () => {
    expect(getSubmitHref([], 0, true, seeAll, true)).toBe(seeAll);
  });

  it('does nothing when the input is empty', () => {
    expect(getSubmitHref([], 0, true, '/search?q=', false)).toBeNull();
  });
});

describe('moveSelection', () => {
  it('moves down and wraps to the top', () => {
    expect(moveSelection('ArrowDown', 0, 3)).toBe(1);
    expect(moveSelection('ArrowDown', 2, 3)).toBe(0);
  });

  it('moves up and wraps to the bottom', () => {
    expect(moveSelection('ArrowUp', 1, 3)).toBe(0);
    expect(moveSelection('ArrowUp', 0, 3)).toBe(2);
  });

  it('stays put for other keys', () => {
    expect(moveSelection('Enter', 1, 3)).toBe(1);
    expect(moveSelection('a', 2, 3)).toBe(2);
  });

  it('returns 0 when the list is empty', () => {
    expect(moveSelection('ArrowDown', 5, 0)).toBe(0);
  });
});
