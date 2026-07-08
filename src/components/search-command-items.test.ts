import { describe, expect, it } from 'vitest';

import type { SearchMultiResult } from '@/lib/search';

import { moveSelection, toSearchCommandItems } from './search-command-items';

type MultiResult = SearchMultiResult['results'][number];

const imageUrls = { src: 'src', srcSetAvif: 'avif', srcSetWebp: 'webp' };

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
    const [item] = toSearchCommandItems([movie({ posterImageUrls: imageUrls } as never)]);

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
    const [item] = toSearchCommandItems([
      {
        id: 2,
        media_type: 'tv',
        name: 'The Office',
        first_air_date: '2005-03-24',
        poster_path: null,
      } as MultiResult,
    ]);

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
    const [item] = toSearchCommandItems([
      {
        id: 3,
        media_type: 'person',
        name: 'Keanu Reeves',
        known_for_department: 'Acting',
        profile_path: '/keanu.jpg',
      } as MultiResult,
    ]);

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
    const [item] = toSearchCommandItems([movie({ release_date: '' })]);
    expect(item.subtitle).toBe('');
  });

  it('drops unsupported media types', () => {
    const items = toSearchCommandItems([
      { id: 4, media_type: 'collection' } as unknown as MultiResult,
      movie(),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].key).toBe('movie-1');
  });

  it('caps the list at the given limit', () => {
    const results = Array.from({ length: 12 }, (_, index) => movie({ id: index + 1 }));
    expect(toSearchCommandItems(results)).toHaveLength(8);
    expect(toSearchCommandItems(results, 3)).toHaveLength(3);
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
