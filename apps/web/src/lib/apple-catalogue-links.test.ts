import { describe, expect, it } from 'vite-plus/test';

import type { WatchTitleContext } from '@/types/watch-provider';

import { buildAppleCatalogueLinks } from './apple-catalogue-links';

const context: WatchTitleContext = {
  type: 'movie',
  id: 1051896,
  title: 'Arcadian',
  originalTitle: 'Arcadian',
  releaseDate: '2024-04-12',
  homepage: null,
};
const movie = {
  wrapperType: 'track',
  kind: 'feature-movie',
  trackId: 1735930123,
  trackName: 'Arcadian',
  artistName: 'Benjamin Brewer',
  releaseDate: '2024-04-12T07:00:00Z',
  trackViewUrl: 'https://itunes.apple.com/se/movie/arcadian/id1735930123?uo=4',
};

function match(
  results: unknown[],
  title = context,
  region = 'SE',
  directors = ['Benjamin Brewer'],
) {
  return buildAppleCatalogueLinks({ results }, title, region, directors);
}

describe('Apple catalogue destination matching', () => {
  it('matches the work and storefront, strips tracking and only grants store offers', () => {
    expect(match([movie])).toEqual([
      {
        providerId: 2,
        regions: ['SE'],
        types: ['rent', 'buy'],
        url: 'https://itunes.apple.com/se/movie/id1735930123',
      },
    ]);
  });

  it('accepts normalized original titles, explicit release-year suffixes and co-directors', () => {
    expect(
      match([{ ...movie, trackName: 'Àrcadian (2024)', artistName: 'Other & Benjamin Brewer' }], {
        ...context,
        title: 'Localized title',
      }),
    ).toHaveLength(1);
  });

  it.each([
    { trackName: 'Arcadian 2' },
    { artistName: 'Another Director' },
    { releaseDate: '2023-04-12T07:00:00Z' },
    { releaseDate: 'invalid' },
    { kind: 'tv-episode' },
    { wrapperType: 'collection' },
    { trackId: 1234567 },
    { trackViewUrl: 'https://itunes.apple.com/us/movie/id1735930123' },
    { trackViewUrl: 'http://itunes.apple.com/se/movie/id1735930123' },
    { trackViewUrl: 'https://itunes.apple.com.evil.test/se/movie/id1735930123' },
    { trackViewUrl: 'https://user@itunes.apple.com/se/movie/id1735930123' },
    { trackViewUrl: 'https://itunes.apple.com:444/se/movie/id1735930123' },
    { trackViewUrl: 'https://itunes.apple.com/se/album/id1735930123' },
    { trackViewUrl: 'https://itunes.apple.com/se/movie/' },
  ])('rejects mismatched or unsafe result %j', (patch) => {
    expect(match([{ ...movie, ...patch }])).toEqual([]);
  });

  it('rejects missing identity data and malformed envelopes', () => {
    expect(match([movie], context, 'SE', [])).toEqual([]);
    expect(match([movie], { ...context, releaseDate: '' })).toEqual([]);
    expect(match([movie], context, '.*')).toEqual([]);
    expect(match([null, {}, { ...movie, trackViewUrl: 'not a URL' }])).toEqual([]);
    expect(buildAppleCatalogueLinks(null, context, 'SE', [])).toEqual([]);
    expect(match(Array(201).fill(movie))).toEqual([]);
  });

  it('rejects ambiguous editions but deduplicates identical destinations', () => {
    expect(match([movie, movie])).toHaveLength(1);
    expect(
      match([
        movie,
        {
          ...movie,
          trackId: 1735930124,
          trackViewUrl: 'https://itunes.apple.com/se/movie/id1735930124',
        },
      ]),
    ).toEqual([]);
  });

  it('accepts a returned Apple TV movie page without changing its storefront', () => {
    const url = 'https://tv.apple.com/se/movie/umc.cmc.123456789012345678901234';
    expect(match([{ ...movie, trackViewUrl: url }])[0]?.url).toBe(url);
    expect(match([{ ...movie, trackViewUrl: url }], context, 'US')).toEqual([]);
  });

  const show: WatchTitleContext = {
    ...context,
    type: 'tv',
    title: 'The Last of Us',
    originalTitle: 'The Last of Us',
    releaseDate: '2023-01-15',
  };
  const season = {
    wrapperType: 'collection',
    collectionType: 'TV Season',
    artistName: 'The Last of Us',
    collectionName: 'The Last of Us, Season 1',
    releaseDate: '2023-01-15T00:00:00Z',
    artistViewUrl: 'https://itunes.apple.com/se/tv-show/the-last-of-us/id1658272963',
  };

  it('only uses a genuine series destination from a matching first-season result', () => {
    expect(match([season], show)[0]?.url).toBe('https://itunes.apple.com/se/tv-show/id1658272963');
  });

  it.each([
    { artistViewUrl: 'https://itunes.apple.com/se/tv-season/id1658272963' },
    { artistViewUrl: 'https://itunes.apple.com/se/tv-episode/id1658272963' },
    { artistViewUrl: 'https://itunes.apple.com/us/tv-show/id1658272963' },
    { collectionName: 'The Last of Us, Season 11' },
    { collectionName: 'The Last of Us, Season 2' },
    { artistName: 'Another Show' },
    { releaseDate: '2024-01-15T00:00:00Z' },
    { collectionType: 'Album' },
    { artistViewUrl: undefined },
  ])('does not misrepresent a season or another show: %j', (patch) => {
    expect(match([{ ...season, ...patch }], show)).toEqual([]);
  });
});
