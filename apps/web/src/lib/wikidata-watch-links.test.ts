import { describe, expect, it } from 'vite-plus/test';

import { getDirectWatchUrl } from './watch-links';
import { buildWikidataWatchLinks } from './wikidata-watch-links';

function statement(value: string, rank = 'normal', qualifiers?: Record<string, unknown>) {
  return {
    rank,
    qualifiers,
    mainsnak: { snaktype: 'value', datatype: 'external-id', datavalue: { value } },
  };
}

const disneyId = 'entity-f6174ebf-cb92-453c-a52b-62bb3576e402';
const appleId = 'umc.cmc.vtoh0mn0xn7t3c643xqonfzy';
const huluId = 'e47078f3-1c0e-49a8-9da9-c571a7a20fec';

describe('Wikidata provider identifiers', () => {
  it.each([
    ['movie', 'P1874', '80057281', 8, 'https://www.netflix.com/title/80057281'],
    ['tv', 'P1874', '80057281', 8, 'https://www.netflix.com/title/80057281'],
    ['movie', 'P13902', disneyId, 337, `https://www.disneyplus.com/browse/${disneyId}`],
    ['tv', 'P13902', disneyId, 337, `https://www.disneyplus.com/browse/${disneyId}`],
    ['movie', 'P9586', appleId, 350, `https://tv.apple.com/movie/${appleId}`],
    ['tv', 'P9751', appleId, 350, `https://tv.apple.com/show/${appleId}`],
    ['movie', 'P6466', huluId, 15, `https://www.hulu.com/movie/${huluId}`],
    ['tv', 'P6467', huluId, 15, `https://www.hulu.com/series/${huluId}`],
    ['movie', 'P8055', 'B07ZPDN57Q', 9, 'https://www.amazon.com/gp/video/detail/B07ZPDN57Q'],
  ] as const)(
    'constructs %s %s links from identifiers',
    (type, property, value, providerId, url) => {
      expect(buildWikidataWatchLinks({ [property]: [statement(value)] }, type)).toContainEqual(
        expect.objectContaining({ providerId, url }),
      );
    },
  );

  it('does not treat movie identifiers as series identifiers', () => {
    expect(
      buildWikidataWatchLinks({ P9586: [statement(appleId)], P6466: [statement(huluId)] }, 'tv'),
    ).toEqual([]);
  });

  it('keeps Apple and Amazon subscription and transactional provider IDs distinct', () => {
    const links = buildWikidataWatchLinks(
      { P9586: [statement(appleId)], P8055: [statement('B07ZPDN57Q')] },
      'movie',
    );
    expect(getDirectWatchUrl(links, 350, 'SE', 'flatrate')).toContain('tv.apple.com/movie/');
    expect(getDirectWatchUrl(links, 2, 'SE', 'rent')).toContain('tv.apple.com/movie/');
    expect(getDirectWatchUrl(links, 350, 'SE', 'rent')).toBeUndefined();
    expect(getDirectWatchUrl(links, 2, 'SE', 'flatrate')).toBeUndefined();
    expect(getDirectWatchUrl(links, 9, 'US', 'flatrate')).toContain('amazon.com');
    expect(getDirectWatchUrl(links, 10, 'US', 'buy')).toContain('amazon.com');
    expect(getDirectWatchUrl(links, 9, 'SE', 'flatrate')).toBeUndefined();
    expect(getDirectWatchUrl(links, 10, 'GB', 'rent')).toBeUndefined();
    expect(getDirectWatchUrl(links, 119, 'US', 'flatrate')).toBeUndefined();
  });

  it('restricts Hulu to the US', () => {
    const links = buildWikidataWatchLinks({ P6467: [statement(huluId)] }, 'tv');
    expect(getDirectWatchUrl(links, 15, 'US', 'flatrate')).toContain('hulu.com');
    expect(getDirectWatchUrl(links, 15, 'JP', 'flatrate')).toBeUndefined();
  });

  it('prefers preferred statements, deduplicates identical IDs and skips conflicts', () => {
    expect(
      buildWikidataWatchLinks(
        { P1874: [statement('80057281'), statement('12345678', 'preferred')] },
        'tv',
      )[0].url,
    ).toContain('12345678');
    expect(
      buildWikidataWatchLinks({ P1874: [statement('80057281'), statement('80057281')] }, 'tv'),
    ).toHaveLength(1);
    expect(
      buildWikidataWatchLinks({ P1874: [statement('80057281'), statement('12345678')] }, 'tv'),
    ).toEqual([]);
  });

  it('skips deprecated, qualified, unknown and malformed claims without losing valid properties', () => {
    const claims = {
      P1874: [
        statement('80057281', 'deprecated'),
        statement('80057281', 'normal', { P17: [{}] }),
        { mainsnak: { snaktype: 'novalue' } },
        null,
      ],
      P8055: [statement('B07ZPDN57Q')],
      P13902: {},
    };
    expect(buildWikidataWatchLinks(claims, 'tv').map((link) => link.providerId)).toEqual([9, 10]);
    expect(buildWikidataWatchLinks({}, 'tv')).toEqual([]);
  });

  it.each([
    ['P1874', 'https://evil.com'],
    ['P1874', '80057281/../123'],
    ['P1874', '123'],
    ['P13902', 'page-f6174ebf-cb92-453c-a52b-62bb3576e402'],
    ['P13902', 'legacy-disney-id'],
    ['P9586', 'umc.cmc.invalid'],
    ['P6466', 'not-a-uuid'],
    ['P8055', 'B07ZPDN57Q?redirect=evil'],
  ])('rejects malformed or unsafe identifiers for %s: %s', (property, value) => {
    expect(buildWikidataWatchLinks({ [property]: [statement(value)] }, 'movie')).toEqual([]);
  });
});
