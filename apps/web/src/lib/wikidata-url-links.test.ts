import { describe, expect, it } from 'vite-plus/test';

import { getDirectWatchUrl } from './watch-links';
import { buildWikidataWatchLinks } from './wikidata-watch-links';

function statement(value: string, rank = 'normal', qualifiers: Record<string, unknown> = {}) {
  return {
    rank,
    qualifiers,
    mainsnak: { snaktype: 'value', datatype: 'url', datavalue: { value } },
  };
}
function build(url: string, type: 'movie' | 'tv' = 'movie', region = 'SE', property = 'P856') {
  return buildWikidataWatchLinks({ [property]: [statement(url)] }, type, region, '2026-11-05');
}
const apple = 'umc.cmc.vtoh0mn0xn7t3c643xqonfzy';

describe('Wikidata official provider URLs', () => {
  it.each([
    [
      'movie',
      'SE',
      119,
      'flatrate',
      'https://www.primevideo.com/detail/amzn1.dv.gti.afd5bf09-38ee-44f6-b4c0-78d991a104fd',
    ],
    ['movie', 'SE', 8, 'flatrate', 'https://www.netflix.com/se/title/80057281'],
    ['tv', 'SE', 1796, 'flatrate', 'https://www.netflix.com/watch/80057281'],
    [
      'movie',
      'SE',
      337,
      'flatrate',
      'https://www.disneyplus.com/browse/entity-f6174ebf-cb92-453c-a52b-62bb3576e402',
    ],
    ['movie', 'SE', 350, 'flatrate', `https://tv.apple.com/se/movie/my-film/${apple}`],
    ['tv', 'SE', 2, 'buy', `https://tv.apple.com/se/show/my-show/${apple}`],
    [
      'movie',
      'SE',
      119,
      'flatrate',
      'https://www.primevideo.com/detail/0PKD430VQU4ALLISBLIAGREZ99',
    ],
    ['movie', 'US', 10, 'rent', 'https://www.amazon.com/gp/video/detail/B07ZPDN57Q'],
    [
      'movie',
      'SE',
      1899,
      'flatrate',
      'https://play.hbomax.com/movie/f6174ebf-cb92-453c-a52b-62bb3576e402',
    ],
    ['movie', 'SE', 11, 'flatrate', 'https://mubi.com/en/films/oldboy'],
    ['movie', 'US', 73, 'ads', 'https://tubitv.com/movies/123456/my-film'],
    ['tv', 'US', 73, 'free', 'https://tubitv.com/series/123456/my-show'],
    ['tv', 'SE', 344, 'flatrate', 'https://www.viki.com/tv/22943c-nirvana-in-fire'],
    ['movie', 'US', 191, 'free', 'https://www.kanopy.com/en/product/123456'],
    ['movie', 'US', 538, 'ads', 'https://watch.plex.tv/movie/my-film-2020'],
    [
      'movie',
      'US',
      538,
      'free',
      'https://app.plex.tv/desktop/#!/provider/tv.plex.provider.metadata/details?key=/library/metadata/5d77683861141d001fb18459',
    ],
    ['tv', 'SE', 283, 'flatrate', 'https://www.crunchyroll.com/series/GR097JN7R/gurren-lagann'],
    ['tv', 'US', 531, 'flatrate', 'https://www.paramountplus.com/shows/my-show/'],
    ['movie', 'SE', 426, 'rent', 'https://www.sfanytime.com/sv/movie/results'],
    ['movie', 'SE', 35, 'buy', 'https://www.rakuten.tv/se/movies/my-film'],
    [
      'movie',
      'SE',
      1944,
      'flatrate',
      'https://www.tv4play.se/program/251c6ee386132c89bd70/mollys-game',
    ],
    ['movie', 'SE', 496, 'free', 'https://www.cineasterna.com/sv/title/12345'],
    ['tv', 'SE', 1773, 'flatrate', 'https://www.skyshowtime.com/se/stream/tv-shows/my-show/abc123'],
    ['movie', 'GB', 38, 'free', 'https://www.bbc.co.uk/iplayer/episode/b0079rhp/my-film'],
    ['tv', 'GB', 38, 'free', 'https://www.bbc.co.uk/iplayer/episodes/b0079rhp/my-show'],
    ['tv', 'GB', 41, 'ads', 'https://www.itv.com/watch/my-show/2a1234'],
    ['tv', 'GB', 103, 'ads', 'https://www.channel4.com/programmes/my-show'],
    [
      'movie',
      'GB',
      224,
      'flatrate',
      'https://player.bfi.org.uk/subscription/film/watch-my-film-2020-online',
    ],
    [
      'movie',
      'GB',
      224,
      'rent',
      'https://player.bfi.org.uk/rentals/film/watch-my-film-2020-online',
    ],
    ['movie', 'FR', 234, 'free', 'https://www.arte.tv/fr/videos/123456-001-A/my-film'],
    ['tv', 'DK', 620, 'free', 'https://www.dr.dk/drtv/serie/my-show_12345'],
    ['movie', 'ES', 63, 'flatrate', 'https://www.filmin.es/pelicula/my-film'],
    ['tv', 'PT', 63, 'flatrate', 'https://www.filmin.pt/serie/my-show'],
    ['movie', 'US', 190, 'flatrate', 'https://curiositystream.com/video/12345'],
    ['tv', 'US', 99, 'flatrate', 'https://www.shudder.com/series/watch/my-show/abc123'],
    ['movie', 'SE', 76, 'rent', 'https://viaplay.se/store/arcadian-2024'],
    ['movie', 'SE', 76, 'flatrate', 'https://viaplay.se/filmer/my-film-2020'],
    ['tv', 'NO', 76, 'flatrate', 'https://viaplay.no/serier/my-show'],
    ['movie', 'US', 258, 'flatrate', 'https://www.criterionchannel.com/the-doom-generation'],
    ['movie', 'RU', 113, 'flatrate', 'https://www.ivi.tv/watch/123456'],
    ['movie', 'RU', 115, 'rent', 'https://okko.tv/movie/stepnye-bogi/'],
    [
      'movie',
      'RU',
      117,
      'flatrate',
      'https://hd.kinopoisk.ru/film/f6174ebf-cb92-453c-a52b-62bb3576e402',
    ],
    ['movie', 'US', 2529, 'rent', 'https://vimeo.com/ondemand/my-film'],
    ['movie', 'US', 258, 'flatrate', 'https://www.criterionchannel.com/stalker'],
    ['movie', 'US', 7, 'rent', 'https://athome.fandango.com/content/browse/details/wd/12345'],
    ['movie', 'US', 212, 'free', 'https://www.hoopladigital.com/title/11195435'],
    ['movie', 'CA', 441, 'free', 'https://www.nfb.ca/film/the-hat/'],
    ['movie', 'CA', 441, 'free', 'https://www.onf.ca/film/l_anniversaire_de_bob/'],
    ['movie', 'SE', 426, 'rent', 'https://www.sfanytime.com/sv/movie/%C3%A4lska-mig'],
    [
      'movie',
      'US',
      15,
      'flatrate',
      'https://www.hulu.com/movie/my-film-f6174ebf-cb92-453c-a52b-62bb3576e402',
    ],
    [
      'movie',
      'SE',
      119,
      'flatrate',
      'https://www.primevideo.com/detail/my-film/0PKD430VQU4ALLISBLIAGREZ99',
    ],
    [
      'movie',
      'US',
      3,
      'rent',
      'https://play.google.com/store/movies/details/My_Film?id=abcDEF1234',
    ],
  ] as const)(
    'links %s %s provider %s from an exact stored URL',
    (type, region, provider, offer, url) => {
      expect(getDirectWatchUrl(build(url, type, region), provider, region, offer)).toBeTruthy();
    },
  );

  it.each(['P856', 'P953', 'P973'])(
    'accepts reviewed title URLs in %s without additional network lookups',
    (property) => {
      expect(
        getDirectWatchUrl(
          build('https://mubi.com/films/oldboy', 'movie', 'SE', property),
          11,
          'SE',
          'flatrate',
        ),
      ).toBe('https://mubi.com/films/oldboy');
    },
  );
  it('discards tracking/redirect parameters while preserving required store identifiers', () => {
    expect(
      build('https://www.netflix.com/title/80057281?redirect=https://evil.com#fragment')[0]?.url,
    ).toBe('https://www.netflix.com/title/80057281');
    expect(
      build(
        'https://play.google.com/store/movies/details?id=abcDEF1234&redirect=https://evil.com',
      )[0]?.url,
    ).toBe('https://play.google.com/store/movies/details?id=abcDEF1234');
    expect(build('http://www.netflix.com/title/80057281')[0]?.url).toBe(
      'https://www.netflix.com/title/80057281',
    );
  });
  it('only accepts YouTube full-work statements, never ordinary video/trailer identifiers', () => {
    const url = 'https://www.youtube.com/watch?v=abcdefghijk';
    expect(build(url, 'movie', 'US', 'P953').map((link) => link.providerId)).toEqual([
      192, 192, 235, 235,
    ]);
    expect(build(url, 'movie', 'US', 'P856')).toEqual([]);
    expect(build(url, 'movie', 'US', 'P973')).toEqual([]);
    expect(build(url, 'tv', 'US', 'P953')).toEqual([]);
    expect(build('https://www.youtube.com/watch?v=short', 'movie', 'US', 'P953')).toEqual([]);
    expect(build('https://www.youtube.com/watch', 'movie', 'US', 'P953')).toEqual([]);
    expect(
      buildWikidataWatchLinks({ P1651: [statement('abcdefghijk')] }, 'movie', 'US', '2026-11-05'),
    ).toEqual([]);
  });
  it('uses Vimeo video pages only when Wikidata explicitly identifies the full work', () => {
    expect(
      getDirectWatchUrl(
        build('https://vimeo.com/12345678', 'movie', 'US', 'P953'),
        2529,
        'US',
        'free',
      ),
    ).toBe('https://vimeo.com/12345678');
    expect(build('https://vimeo.com/12345678', 'movie', 'US', 'P856')).toEqual([]);
    expect(build('https://vimeo.com/0', 'movie', 'US', 'P953')).toEqual([]);
  });
  it('prefers structured identifiers over official URL fallbacks for the same provider', () => {
    const claims = {
      P1874: [
        {
          ...statement('80057281'),
          mainsnak: {
            snaktype: 'value',
            datatype: 'external-id',
            datavalue: { value: '80057281' },
          },
        },
      ],
      P856: [statement('https://www.netflix.com/title/12345678')],
    };
    expect(
      getDirectWatchUrl(
        buildWikidataWatchLinks(claims, 'movie', 'SE', '2026-11-05'),
        8,
        'SE',
        'flatrate',
      ),
    ).toContain('80057281');
  });
  it('resolves ranks and ambiguity independently for each provider, preserving unrelated links', () => {
    const claims = {
      P856: [
        statement('https://mubi.com/films/oldboy'),
        statement('https://mubi.com/films/another-edition'),
        statement('https://www.netflix.com/title/80057281'),
      ],
    };
    const links = buildWikidataWatchLinks(claims, 'movie', 'SE', '2026-11-05');
    expect(getDirectWatchUrl(links, 11, 'SE', 'flatrate')).toBeUndefined();
    expect(getDirectWatchUrl(links, 8, 'SE', 'flatrate')).toBeTruthy();
    claims.P856[1].rank = 'preferred';
    expect(
      getDirectWatchUrl(
        buildWikidataWatchLinks(claims, 'movie', 'SE', '2026-11-05'),
        11,
        'SE',
        'flatrate',
      ),
    ).toContain('another-edition');
  });

  it.each([
    'not-a-url',
    'https://www.criterionchannel.com/privacy-policy',
    'https://hd.kinopoisk.ru/film/f6174ebf-cb92-053c-a52b-62bb3576e402',
    'https://www.kinopoisk.ru/film/123456/',
    'https://www.netflix.com.evil.com/title/80057281',
    'https://evil.com/title/80057281',
    'https://user:pass@www.netflix.com/title/80057281',
    'https://www.netflix.com:8443/title/80057281',
    'javascript:alert(1)',
    'https://www.netflix.com/redirect?url=https://evil.com',
    'https://www.netflix.com/browse',
    'https://www.netflix.com/title/80057281/extra',
    'https://www.netflix.com/a/../title/80057281',
    'https://www.netflix.com/title/80057281\\evil',
    'https://www.netflix.com/title/%2e%2e/80057281',
    'https://www.sfanytime.com/sv/movie/title%2f..%2flogin',
    'https://www.sfanytime.com/sv/movie/title%252flogin',
    'https://www.netflix.com/title/80057281\n',
    'https://www.svtplay.se/kategori/dokumentarserier',
    'https://www.svtplay.se/medverkande/Person',
    'https://www.viki.com/celebrities/12345',
    'https://www.paramountplus.com/account/',
    'https://www.criterionchannel.com/browse',
    'https://www.criterionchannel.com/sign-up',
    'https://play.google.com/store/movies/details?id=bad%26redirect',
    'https://play.google.com/store/movies/details',
    'https://www.youtube.com/watch?v=short',
    'https://www.hulu.com/movie/my-film-f6174ebf-cb92-053c-a52b-62bb3576e402',
    'https://www.primevideo.com/detail/amzn1.dv.gti.f6174ebf-cb92-053c-a52b-62bb3576e402',
  ])('rejects unsafe URLs, generic pages and malformed identifiers: %s', (url) => {
    expect(build(url)).toEqual([]);
  });

  it.each([
    ['https://tv.apple.com/us/movie/my-film/' + apple, 'movie', 'SE'],
    ['https://www.rakuten.tv/de/movies/my-film', 'movie', 'SE'],
    ['https://viaplay.no/store/arcadian-2024', 'movie', 'SE'],
    ['https://www.skyshowtime.com/no/stream/movies/my-film/abc123', 'movie', 'SE'],
    ['https://www.paramountplus.com/au/movies/my-film', 'movie', 'SE'],
    ['https://www.svtplay.se/aktuellt', 'tv', 'US'],
    ['https://www.filmin.es/pelicula/my-film', 'movie', 'SE'],
    ['https://www.hulu.com/movie/f6174ebf-cb92-453c-a52b-62bb3576e402', 'movie', 'SE'],
    ['https://www.amazon.com/gp/video/detail/B07ZPDN57Q', 'movie', 'SE'],
    ['https://tv.apple.com/se/show/my-show/' + apple, 'movie', 'SE'],
    ['https://tubitv.com/movies/12345/my-film', 'tv', 'US'],
    ['https://www.bbc.co.uk/iplayer/episode/b0079rhp/my-episode', 'tv', 'GB'],
  ] as const)('does not reuse foreign-market or wrong-work URLs: %s', (url, type, region) => {
    expect(build(url, type, region)).toEqual([]);
  });
});
