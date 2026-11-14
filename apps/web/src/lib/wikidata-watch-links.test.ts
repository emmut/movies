import { describe, expect, it } from 'vite-plus/test';

import { getDirectWatchUrl } from './watch-links';
import { buildWikidataWatchLinks } from './wikidata-watch-links';

function statement(
  value: string,
  rank = 'normal',
  qualifiers?: Record<string, unknown>,
  datatype = 'external-id',
) {
  return { rank, qualifiers, mainsnak: { snaktype: 'value', datatype, datavalue: { value } } };
}
function build(claims: Record<string, unknown>, type: 'movie' | 'tv' = 'movie', region = 'US') {
  return buildWikidataWatchLinks(claims, type, region, '2026-11-05');
}
const uuid = 'f6174ebf-cb92-453c-a52b-62bb3576e402';
const apple = 'umc.cmc.vtoh0mn0xn7t3c643xqonfzy';
const gti = 'amzn1.dv.gti.afd5bf09-38ee-44f6-b4c0-78d991a104fd';

describe('Wikidata provider identifiers', () => {
  it.each([
    ['movie', 'US', 'P1874', '80057281', 8, 'https://www.netflix.com/title/80057281'],
    ['tv', 'SE', 'P1874', '80057281', 1796, 'https://www.netflix.com/title/80057281'],
    [
      'movie',
      'SE',
      'P13902',
      `entity-${uuid}`,
      337,
      `https://www.disneyplus.com/browse/entity-${uuid}`,
    ],
    ['movie', 'SE', 'P9586', apple, 350, `https://tv.apple.com/movie/${apple}`],
    ['tv', 'SE', 'P9751', apple, 2, `https://tv.apple.com/show/${apple}`],
    ['movie', 'US', 'P6466', uuid, 15, `https://www.hulu.com/movie/${uuid}`],
    ['tv', 'US', 'P6467', uuid, 15, `https://www.hulu.com/series/${uuid}`],
    ['movie', 'US', 'P8055', 'B07ZPDN57Q', 9, 'https://www.amazon.com/gp/video/detail/B07ZPDN57Q'],
    [
      'movie',
      'SE',
      'P14440',
      '0PKD430VQU4ALLISBLIAGREZ99',
      119,
      'https://www.primevideo.com/detail/0PKD430VQU4ALLISBLIAGREZ99',
    ],
    ['tv', 'SE', 'P14462', gti, 2100, `https://www.primevideo.com/detail/${gti}`],
    [
      'movie',
      'SE',
      'P14440',
      '0PKD430VQU4ALLISBLIAGREZ99',
      10,
      'https://www.primevideo.com/detail/0PKD430VQU4ALLISBLIAGREZ99',
    ],
    ['movie', 'SE', 'P8298', `movie/${uuid}`, 1899, `https://play.hbomax.com/movie/${uuid}`],
    ['tv', 'SE', 'P8298', `show/${uuid}`, 1899, `https://play.hbomax.com/show/${uuid}`],
    ['tv', 'SE', 'P8298', `series/${uuid}`, 1899, `https://play.hbomax.com/series/${uuid}`],
    [
      'movie',
      'SE',
      'P8298',
      'feature/urn:hbo:feature:abcdefghijklmnopqrstu',
      1899,
      'https://play.hbomax.com/feature/urn:hbo:feature:abcdefghijklmnopqrstu',
    ],
    [
      'tv',
      'SE',
      'P8298',
      'series/urn:hbo:series:abcdefghijklmnopqrstu',
      1899,
      'https://play.hbomax.com/series/urn:hbo:series:abcdefghijklmnopqrstu',
    ],
    ['movie', 'SE', 'P7299', '114', 11, 'https://mubi.com/films/114'],
    ['tv', 'SE', 'P7299', '184752', 11, 'https://mubi.com/films/184752'],
    ['movie', 'US', 'P7760', '123456', 73, 'https://tubitv.com/movies/123456'],
    ['tv', 'US', 'P7761', '12345', 73, 'https://tubitv.com/series/12345'],
    [
      'movie',
      'US',
      'P11815',
      'movies/psych-3-this-is-gus',
      387,
      'https://www.peacocktv.com/stream-movies/psych-3-this-is-gus',
    ],
    [
      'tv',
      'US',
      'P11815',
      'tv/joe-vs-carole',
      386,
      'https://www.peacocktv.com/stream-tv/joe-vs-carole',
    ],
    [
      'movie',
      'US',
      'P13147',
      'X18F11X2ievPOgXVRm9wkyMQK_eoggYs',
      531,
      'https://www.paramountplus.com/shows/video/X18F11X2ievPOgXVRm9wkyMQK_eoggYs/',
    ],
    ['tv', 'SE', 'P6817', 'aktuellt', 493, 'https://www.svtplay.se/aktuellt'],
    ['tv', 'NO', 'P9979', 'serie/skam', 442, 'https://tv.nrk.no/serie/skam'],
    ['movie', 'NO', 'P9979', 'program/ABCD12345678', 442, 'https://tv.nrk.no/program/ABCD12345678'],
    ['tv', 'FI', 'P3414', '1-12345', 323, 'https://areena.yle.fi/1-12345'],
    ['movie', 'DK', 'P8928', '1234567890', 443, 'https://fjernleje.filmstriben.dk/film/1234567890'],
    ['tv', 'SE', 'P10344', 'tv/22943', 344, 'https://www.viki.com/tv/22943'],
    ['movie', 'SE', 'P10344', 'movies/12345', 344, 'https://www.viki.com/movies/12345'],
    [
      'movie',
      'US',
      'P11460',
      '5d77683861141d001fb18459',
      538,
      'https://app.plex.tv/desktop/#!/provider/tv.plex.provider.metadata/details?key=/library/metadata/5d77683861141d001fb18459',
    ],
    [
      'movie',
      'US',
      'P7334',
      '123456',
      7,
      'https://athome.fandango.com/content/browse/details/wd/123456',
    ],
    ['tv', 'US', 'P7985', 'my-title', 191, 'https://www.kanopy.com/product/my-title'],
    ['movie', 'US', 'P5680', '11195435', 212, 'https://www.hoopladigital.com/title/11195435'],
    ['tv', 'GB', 'P827', 'b0079rhp', 38, 'https://www.bbc.co.uk/programmes/b0079rhp'],
    ['tv', 'SE', 'P11330', 'GR097JN7R', 283, 'https://www.crunchyroll.com/series/GR097JN7R'],
    ['movie', 'SE', 'P11330', 'GP5HJ8425', 283, 'https://www.crunchyroll.com/series/GP5HJ8425'],
    ['tv', 'IT', 'P11119', 'my-show', 222, 'https://www.raiplay.it/programmi/my-show'],
    ['tv', 'JP', 'P14567', 'SID0089093', 84, 'https://video.unext.jp/title/SID0089093'],
    ['tv', 'JP', 'P14599', '90-979', 1884, 'https://abema.tv/video/title/90-979'],
    ['tv', 'JP', 'P14596', '3125', 2683, 'https://fod.fujitv.co.jp/title/3125'],
    ['movie', 'CA', 'P4606', 'the-hat', 441, 'https://www.nfb.ca/film/the-hat/'],
    ['movie', 'CA', 'P4606', 'bobs_birthday', 441, 'https://www.nfb.ca/film/bobs_birthday/'],
    ['movie', 'SE', 'P14403', '228', 2736, 'https://www.brew.tv/movie/228'],
    ['movie', 'RU', 'P11682', '123456', 113, 'https://www.ivi.ru/watch/123456'],
    ['tv', 'RU', 'P11682', 'my-show', 113, 'https://www.ivi.ru/watch/my-show'],
    ['movie', 'RU', 'P14727', 'stepnye-bogi', 115, 'https://okko.tv/movie/stepnye-bogi/'],
    ['movie', 'US', 'P6398', '1202441786', 2, 'https://itunes.apple.com/us/movie/id1202441786'],
  ] as const)(
    'constructs %s %s %s destinations',
    (type, region, property, value, providerId, url) => {
      expect(build({ [property]: [statement(value)] }, type, region)).toContainEqual(
        expect.objectContaining({ providerId, url, regions: [region] }),
      );
    },
  );

  it('keeps subscription, transactional and free offer types distinct', () => {
    const links = build({ P9586: [statement(apple)], P7334: [statement('12345')] });
    expect(getDirectWatchUrl(links, 350, 'US', 'flatrate')).toContain('tv.apple.com');
    expect(getDirectWatchUrl(links, 350, 'US', 'rent')).toBeUndefined();
    expect(getDirectWatchUrl(links, 2, 'US', 'flatrate')).toBeUndefined();
    expect(getDirectWatchUrl(links, 7, 'US', 'rent')).toContain('fandango.com');
    expect(getDirectWatchUrl(links, 7, 'US', 'free')).toBeUndefined();
    expect(getDirectWatchUrl(links, 332, 'US', 'ads')).toContain('fandango.com');
  });

  it('does not give standalone identifiers to channel bundles', () => {
    const ids = build({
      P14440: [statement('0PKD430VQU4ALLISBLIAGREZ99')],
      P7299: [statement('114')],
      P9586: [statement(apple)],
    }).map((link) => link.providerId);
    expect(ids).toEqual(expect.arrayContaining([9, 119, 2100, 613, 10, 11, 350, 2]));
    expect(ids).not.toEqual(expect.arrayContaining([201, 2243]));
    expect(ids).not.toContain(201);
    expect(ids).not.toContain(2243);
  });

  it('prefers international Prime IDs and then GTI before the US-only ASIN', () => {
    const links = build({
      P14440: [statement('0PKD430VQU4ALLISBLIAGREZ99')],
      P14462: [statement(gti)],
      P8055: [statement('B07ZPDN57Q')],
    });
    expect(getDirectWatchUrl(links, 119, 'US', 'flatrate')).toContain('0PKD430VQU4ALLISBLIAGREZ99');
    expect(build({ P8055: [statement('B07ZPDN57Q')] }, 'movie', 'SE')).toEqual([]);
    expect(
      getDirectWatchUrl(build({ P14462: [statement(gti)] }, 'movie', 'SE'), 119, 'SE', 'flatrate'),
    ).toContain(gti);
  });

  it('respects preferred rank, deduplicates identical values and abstains on conflicts', () => {
    expect(
      build({ P1874: [statement('80057281'), statement('12345678', 'preferred')] })[0]?.url,
    ).toContain('12345678');
    expect(build({ P1874: [statement('80057281'), statement('80057281')] })).toHaveLength(3);
    expect(build({ P1874: [statement('80057281'), statement('12345678')] })).toEqual([]);
  });

  it.each([
    ['P1874', 'https://evil.com'],
    ['P1874', '80057281/../123'],
    ['P1874', '123'],
    ['P13902', `page-${uuid}`],
    ['P13902', 'legacy-disney-id'],
    ['P9586', 'umc.cmc.invalid'],
    ['P6466', 'not-a-uuid'],
    ['P8055', 'B07ZPDN57Q?redirect=evil'],
    ['P14440', '../evil'],
    ['P8298', `show/${uuid}`],
    ['P8298', `season/${uuid}`],
    ['P6817', 'kategori/dokumentarserier'],
    ['P6817', 'medverkande/Person'],
    ['P9979', 'serie/skam/sesong/1'],
    ['P10344', 'celebrities/12345'],
  ])(
    'rejects unsafe IDs, wrong work types and category/person/season pages: %s %s',
    (property, value) => {
      expect(build({ [property]: [statement(value)] })).toEqual([]);
    },
  );

  it('does not use film/episode IDs for whole TV series', () => {
    expect(
      build(
        {
          P9586: [statement(apple)],
          P6466: [statement(uuid)],
          P13147: [statement('1792909654')],
          P7760: [statement('12345')],
        },
        'tv',
      ),
    ).toEqual([]);
  });

  it('skips malformed and deprecated statements without dropping valid properties', () => {
    expect(
      build({
        P1874: [null, statement('80057281', 'deprecated'), { mainsnak: { snaktype: 'novalue' } }],
        P7299: [statement('114')],
        P13902: {},
      }).map((link) => link.providerId),
    ).toEqual([11]);
    expect(build({})).toEqual([]);
  });
  it('retains fallback for conflicting identifiers even when a valid URL could restore them', () => {
    const claims = {
      P1874: [statement('80057281'), statement('12345678')],
      P856: [statement('https://www.netflix.com/title/80057281', 'normal', undefined, 'url')],
      P7299: [statement('114')],
    };
    const links = build(claims, 'movie', 'SE');
    expect(getDirectWatchUrl(links, 8, 'SE', 'flatrate')).toBeUndefined();
    expect(getDirectWatchUrl(links, 1796, 'SE', 'flatrate')).toBeUndefined();
    expect(getDirectWatchUrl(links, 11, 'SE', 'flatrate')).toBeTruthy();
  });
});
