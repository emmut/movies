import { z } from 'zod';

import { wikidataLinkRules } from '@/lib/wikidata-link-rules';
import { uniqueWikidataValue, wikidataStatements } from '@/lib/wikidata-statements';
import type { DirectWatchLink, WatchOfferType } from '@/types/watch-provider';

type UrlRule = {
  hosts: string[];
  path: RegExp;
  providerIds: number[];
  types: WatchOfferType[];
  regions: string[] | undefined;
};
const streaming: WatchOfferType[] = ['flatrate', 'free', 'ads'];
const transactional: WatchOfferType[] = ['rent', 'buy'];
const allOffers: WatchOfferType[] = [...streaming, ...transactional];
const slug = '(?:[a-zA-Z0-9_-]|%[a-fA-F0-9]{2})+';

/** Exact URLs already attached to the work can cover services with no dedicated ID property. */
function urlRules(type: 'movie' | 'tv'): UrlRule[] {
  const film = type === 'movie';
  const paths = {
    movie: {
      apple: 'movie',
      tubi: 'movies',
      viki: 'movies',
      plex: 'movie',
      paramount: 'movies',
      sf: 'movie',
      rakuten: 'movies',
      sky: 'movies',
      bbc: 'episode',
      filmin: 'pelicula',
      filminPt: 'filme',
      curiosity: 'video',
      shudder: 'movies',
    },
    tv: {
      apple: 'show',
      tubi: 'series',
      viki: 'tv',
      plex: 'show',
      paramount: 'shows',
      sf: 'tv',
      rakuten: 'tv_shows',
      sky: 'tv-shows',
      bbc: 'episodes',
      filmin: 'serie',
      filminPt: 'serie',
      curiosity: 'series',
      shudder: 'series',
    },
  }[type];
  return [
    {
      hosts: ['netflix.com', 'www.netflix.com'],
      path: /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:title|watch)\/\d{6,8}\/?$/,
      providerIds: [8, 175, 1796],
      types: ['flatrate'],
      regions: undefined,
    },
    {
      hosts: ['tv.apple.com'],
      path: new RegExp(
        `^/(?:[a-z]{2}/)?${paths.apple}/(?:${slug}/)?umc\\.cmc\\.[a-z0-9]{22,25}/?$`,
      ),
      providerIds: [350],
      types: ['flatrate'],
      regions: undefined,
    },
    {
      hosts: ['tv.apple.com'],
      path: new RegExp(
        `^/(?:[a-z]{2}/)?${paths.apple}/(?:${slug}/)?umc\\.cmc\\.[a-z0-9]{22,25}/?$`,
      ),
      providerIds: [2],
      types: transactional,
      regions: undefined,
    },
    {
      hosts: ['mubi.com', 'www.mubi.com'],
      path: new RegExp(`^/(?:[a-z]{2}/)?films/${slug}/?$`),
      providerIds: [11],
      types: allOffers,
      regions: undefined,
    },
    {
      hosts: ['tubitv.com', 'www.tubitv.com'],
      path: new RegExp(`^/${paths.tubi}/[0-9]+(?:/${slug})?/?$`),
      providerIds: [73],
      types: ['free', 'ads'],
      regions: undefined,
    },
    {
      hosts: ['viki.com', 'www.viki.com'],
      path: new RegExp(`^/${paths.viki}/[0-9]+[a-z]?(?:-${slug})?/?$`),
      providerIds: [344],
      types: streaming,
      regions: undefined,
    },
    {
      hosts: ['www.kanopy.com', 'kanopy.com'],
      path: new RegExp(`^/(?:[a-z]{2}/)?product/${slug}/?$`),
      providerIds: [191],
      types: ['free', 'flatrate'],
      regions: undefined,
    },
    {
      hosts: ['watch.plex.tv'],
      path: new RegExp(`^/${paths.plex}/${slug}/?$`),
      providerIds: [538],
      types: ['free', 'ads'],
      regions: undefined,
    },
    {
      hosts: ['www.crunchyroll.com', 'crunchyroll.com'],
      path: new RegExp(`^/(?:[a-z]{2}(?:-[a-z]{2})?/)?series/[A-Z0-9]{9,10}(?:/${slug})?/?$`),
      providerIds: [283],
      types: streaming,
      regions: undefined,
    },
    {
      hosts: ['www.paramountplus.com'],
      path: new RegExp(`^/(?:[a-z]{2}/)?${paths.paramount}/${slug}/?$`),
      providerIds: [531, 2303, 2304, 2616],
      types: ['flatrate'],
      regions: undefined,
    },
    {
      hosts: ['www.sfanytime.com', 'sfanytime.com'],
      path: new RegExp(`^/[a-z]{2}/${paths.sf}/${slug}/?$`),
      providerIds: [426],
      types: transactional,
      regions: undefined,
    },
    {
      hosts: ['www.rakuten.tv', 'rakuten.tv'],
      path: new RegExp(`^/[a-z]{2}/${paths.rakuten}/${slug}/?$`),
      providerIds: [35],
      types: allOffers,
      regions: undefined,
    },
    {
      hosts: ['www.tv4play.se', 'tv4play.se'],
      path: new RegExp(`^/program/[a-f0-9]{20}(?:/${slug})?/?$`),
      providerIds: [1944],
      types: streaming,
      regions: ['SE'],
    },
    {
      hosts: ['www.cineasterna.com', 'cineasterna.com'],
      path: /^\/[a-z]{2}\/title\/\d+\/?$/,
      providerIds: [496],
      types: ['free', 'flatrate'],
      regions: ['SE'],
    },
    {
      hosts: ['www.skyshowtime.com', 'skyshowtime.com'],
      path: new RegExp(`^/[a-z]{2}/stream/${paths.sky}/${slug}/${slug}/?$`),
      providerIds: [1773],
      types: ['flatrate'],
      regions: undefined,
    },
    {
      hosts: ['www.bbc.co.uk'],
      path: new RegExp(`^/iplayer/${paths.bbc}/[b-df-hj-np-tv-z0-9]{8,11}(?:/${slug})?/?$`),
      providerIds: [38],
      types: streaming,
      regions: ['GB'],
    },
    {
      hosts: ['www.itv.com'],
      path: new RegExp(`^/watch/${slug}/${slug}(?:/${slug})?/?$`),
      providerIds: [41, 2300],
      types: streaming,
      regions: ['GB'],
    },
    {
      hosts: ['www.channel4.com'],
      path: new RegExp(`^/programmes/${slug}/?$`),
      providerIds: [103, 2311],
      types: streaming,
      regions: ['GB'],
    },
    {
      hosts: ['player.bfi.org.uk'],
      path: new RegExp(`^/subscription/film/watch-${slug}-online/?$`),
      providerIds: [224],
      types: ['flatrate'],
      regions: ['GB'],
    },
    {
      hosts: ['player.bfi.org.uk'],
      path: new RegExp(`^/rentals/film/watch-${slug}-online/?$`),
      providerIds: [224],
      types: transactional,
      regions: ['GB'],
    },
    {
      hosts: ['www.arte.tv', 'arte.tv'],
      path: new RegExp(`^/[a-z]{2}/videos/[0-9]{6}-[0-9]{3}-[A-Z](?:/${slug})?/?$`),
      providerIds: [234],
      types: ['free', 'ads'],
      regions: undefined,
    },
    {
      hosts: ['www.dr.dk', 'dr.dk'],
      path: new RegExp(`^/drtv/(?:program|serie)/${slug}/?$`),
      providerIds: [620],
      types: ['free', 'ads'],
      regions: ['DK'],
    },
    {
      hosts: ['www.filmin.es', 'filmin.es'],
      path: new RegExp(`^/${paths.filmin}/${slug}/?$`),
      providerIds: [63, 64],
      types: allOffers,
      regions: ['ES'],
    },
    {
      hosts: ['www.filmin.pt', 'filmin.pt'],
      path: new RegExp(`^/${paths.filminPt}/${slug}/?$`),
      providerIds: [63, 64],
      types: allOffers,
      regions: ['PT'],
    },
    {
      hosts: ['www.curiositystream.com', 'curiositystream.com'],
      path: new RegExp(`^/${paths.curiosity}/[0-9]+/?$`),
      providerIds: [190],
      types: ['flatrate'],
      regions: undefined,
    },
    {
      hosts: ['www.shudder.com', 'shudder.com'],
      path: new RegExp(`^/${paths.shudder}/watch/${slug}/${slug}/?$`),
      providerIds: [99],
      types: ['flatrate'],
      regions: undefined,
    },
    {
      hosts: ['www.primevideo.com', 'primevideo.com'],
      path: new RegExp(
        `^/detail/(?:${slug}/)?(?:[A-Z0-9]{26}|amzn1\\.dv\\.gti\\.[a-f0-9-]{36})/?$`,
      ),
      providerIds: [9, 119, 2100, 613],
      types: streaming,
      regions: undefined,
    },
    {
      hosts: ['www.primevideo.com', 'primevideo.com'],
      path: new RegExp(`^/detail/(?:${slug}/)?[A-Z0-9]{26}/?$`),
      providerIds: [10],
      types: transactional,
      regions: undefined,
    },
    {
      hosts: ['www.hulu.com', 'hulu.com'],
      path: new RegExp(`^/${{ movie: 'movie', tv: 'series' }[type]}/(?:${slug}-)?[a-f0-9-]{36}/?$`),
      providerIds: [15],
      types: ['flatrate'],
      regions: ['US'],
    },
    {
      hosts: ['www.nfb.ca', 'nfb.ca', 'www.onf.ca', 'onf.ca'],
      path: new RegExp(`^/film/${slug}/?$`),
      providerIds: [441],
      types: streaming,
      regions: undefined,
    },
    {
      hosts: ['www.ivi.ru', 'ivi.ru', 'www.ivi.tv', 'ivi.tv'],
      path: new RegExp(`^/watch/${slug}/?$`),
      providerIds: [113],
      types: allOffers,
      regions: undefined,
    },
    {
      hosts: ['okko.tv', 'www.okko.tv'],
      path: new RegExp(`^/${{ movie: 'movie', tv: 'serial' }[type]}/${slug}/?$`),
      providerIds: [115],
      types: allOffers,
      regions: undefined,
    },
    {
      hosts: ['hd.kinopoisk.ru'],
      path: /^\/film\/[a-f0-9-]{36}\/?$/,
      providerIds: [117],
      types: allOffers,
      regions: undefined,
    },
    {
      hosts: ['vimeo.com', 'www.vimeo.com'],
      path: new RegExp(`^/ondemand/${slug}/?$`),
      providerIds: [2529],
      types: transactional,
      regions: undefined,
    },
    ...viaplayRules(film),
    ...criterionRules(film),
  ];
}

function viaplayRules(film: boolean): UrlRule[] {
  return [
    ['se', 'SE'],
    ['no', 'NO'],
    ['dk', 'DK'],
    ['fi', 'FI'],
    ['is', 'IS'],
    ['pl', 'PL'],
    ['nl', 'NL'],
  ].flatMap(([domain, region]) => [
    {
      hosts: [`viaplay.${domain}`, `www.viaplay.${domain}`],
      path: new RegExp(
        `^/${film ? '(?:filmer|film|movies|films|elokuvat)' : '(?:serier|series|sarjat)'}/${slug}/?$`,
      ),
      providerIds: [76],
      types: ['flatrate' as const],
      regions: [region],
    },
    {
      hosts: [`viaplay.${domain}`, `www.viaplay.${domain}`],
      path: new RegExp(`^/store/${slug}/?$`),
      providerIds: [76],
      types: transactional,
      regions: [region],
    },
  ]);
}

function criterionRules(film: boolean): UrlRule[] {
  if (!film) return [];
  return [
    {
      hosts: ['www.criterionchannel.com', 'criterionchannel.com'],
      // This service uses root-level title slugs; exclude its non-title routes.
      path: /^\/(?!browse\/?$|search\/?$|videos\/?$|categories\/?$|collections\/?$|login\/?$|join\/?$|signup\/?$|sign-up\/?$|sign-in\/?$|privacy-policy\/?$|terms-of-use\/?$|terms-of-service\/?$|create-account\/?$|forgot-password\/?$|reset-password\/?$|help\/?$|about\/?$|terms\/?$|privacy\/?$)[a-z0-9]+(?:-[a-z0-9]+)*\/?$/,
      providerIds: [258],
      types: ['flatrate'],
      regions: ['US', 'CA'],
    },
  ];
}

function unsafeUrlCharacters(value: string) {
  return (
    /[\\\s]/.test(value) ||
    Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  );
}

function safeUrl(value: string) {
  if (unsafeUrlCharacters(value)) return null;
  if (/\/(?:\.|\.\.)(?:\/|[?#]|$)/.test(value)) return null;
  if (/%(?:2[ef]|5c|25|0[0-9a-f]|1[0-9a-f]|20|7f)/i.test(value.split(/[?#]/, 1)[0])) return null;
  const parsed = z.url().safeParse(value);
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port)
    return null;
  url.protocol = 'https:';
  return url;
}

function urlRegion(url: URL) {
  // These services put an ISO country (not merely a language) in their title URLs.
  if (
    [
      'www.rakuten.tv',
      'rakuten.tv',
      'www.skyshowtime.com',
      'skyshowtime.com',
      'www.paramountplus.com',
    ].includes(url.hostname)
  ) {
    return url.pathname.match(/^\/([a-z]{2})\//)?.[1].toUpperCase();
  }
  return undefined;
}

function validUrlIdentifier(url: URL) {
  const path = url.pathname.replace(/\/$/, '');
  if (['www.hulu.com', 'hulu.com', 'hd.kinopoisk.ru'].includes(url.hostname)) {
    return z.uuid().safeParse(path.slice(-36)).success;
  }
  if (
    ['www.primevideo.com', 'primevideo.com'].includes(url.hostname) &&
    path.includes('amzn1.dv.gti.')
  ) {
    return z.uuid().safeParse(path.split('amzn1.dv.gti.')[1]).success;
  }
  return true;
}

function structuredUrlLinks(url: URL, type: 'movie' | 'tv', region: string): DirectWatchLink[] {
  return wikidataLinkRules(type).flatMap((rule) => {
    if (rule.regions && !rule.regions.includes(region)) return [];
    const value = rule.prefix.includes('#') ? url.href : `${url.origin}${url.pathname}`;
    if (!value.startsWith(rule.prefix) || !value.endsWith(rule.suffix ?? '')) return [];
    const id = value.slice(rule.prefix.length, rule.suffix ? -rule.suffix.length : undefined);
    const parsed = rule.schema.safeParse(id);
    return parsed.success
      ? rule.providerIds.map((providerId) => ({
          providerId,
          types: rule.types,
          regions: [region],
          url: `${rule.prefix}${parsed.data}${rule.suffix ?? ''}`,
        }))
      : [];
  });
}

function googleStoreLink(url: URL, region: string): DirectWatchLink[] {
  if (
    url.hostname !== 'play.google.com' ||
    !/^\/store\/movies\/details(?:\/[a-zA-Z0-9_-]+)?$/.test(url.pathname)
  )
    return [];
  const id = url.searchParams.get('id');
  return id && /^[a-zA-Z0-9_-]{6,128}$/.test(id)
    ? [
        {
          providerId: 3,
          types: transactional,
          regions: [region],
          url: `https://play.google.com/store/movies/details?id=${encodeURIComponent(id)}`,
        },
      ]
    : [];
}

function youtubeLinks(url: URL, property: string, region: string): DirectWatchLink[] {
  // Ordinary video claims often identify trailers; only full-work claims qualify.
  if (
    property !== 'P953' ||
    !['www.youtube.com', 'youtube.com'].includes(url.hostname) ||
    url.pathname !== '/watch'
  )
    return [];
  const id = url.searchParams.get('v');
  return id && /^[a-zA-Z0-9_-]{11}$/.test(id)
    ? [192, 235].map((providerId) => ({
        providerId,
        types: ['free', 'ads'],
        regions: [region],
        url: `https://www.youtube.com/watch?v=${id}`,
      }))
    : [];
}

function vimeoLinks(url: URL, property: string, region: string): DirectWatchLink[] {
  if (property !== 'P953' || !['vimeo.com', 'www.vimeo.com'].includes(url.hostname)) return [];
  const id = url.pathname.match(/^\/([1-9]\d{0,15})\/?$/)?.[1];
  return id
    ? [
        {
          providerId: 2529,
          types: ['free', 'ads'],
          regions: [region],
          url: `https://vimeo.com/${id}`,
        },
      ]
    : [];
}

function storeUrlLinks(
  url: URL,
  property: string,
  type: 'movie' | 'tv',
  region: string,
): DirectWatchLink[] {
  return type === 'movie'
    ? [
        ...googleStoreLink(url, region),
        ...youtubeLinks(url, property, region),
        ...vimeoLinks(url, property, region),
      ]
    : [];
}

function linksFromUrl(value: string, property: string, type: 'movie' | 'tv', region: string) {
  const parsed = safeUrl(value);
  if (!parsed || !validUrlIdentifier(parsed)) return [];
  const url = canonicalTitleUrl(parsed, type);
  const country = urlRegion(url);
  if (country && country !== region) return [];
  return [
    ...structuredUrlLinks(url, type, region),
    ...matchedUrlLinks(url, type, region),
    ...storeUrlLinks(url, property, type, region),
  ];
}

/** Validate an exact title homepage from another trusted title record using the same provider rules. */
export function reviewedProviderUrlLinks(value: string, type: 'movie' | 'tv', region: string) {
  return linksFromUrl(value, 'P856', type, region);
}

/** Extract the same global title ID used by P9586/P9751/P1874, rather than treating locale paths as separate editions. */
function canonicalTitleUrl(url: URL, type: 'movie' | 'tv') {
  if (url.hostname === 'tv.apple.com') {
    const path = type === 'movie' ? 'movie' : 'show';
    const match = url.pathname.match(
      new RegExp(`^/(?:[a-z]{2}/)?${path}/(?:${slug}/)?(umc\\.cmc\\.[a-z0-9]{22,25})/?$`),
    );
    if (match) return new URL(`https://tv.apple.com/${path}/${match[1]}`);
  }
  if (['www.netflix.com', 'netflix.com'].includes(url.hostname)) {
    const match = url.pathname.match(
      /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:title|watch)\/(\d{6,8})\/?$/,
    );
    if (match) return new URL(`https://www.netflix.com/title/${match[1]}`);
  }
  return url;
}

/** Compare aliases without rewriting the actual validated destination (including required Plex fragments). */
function destinationIdentity(value: string) {
  const url = new URL(value);
  if (url.hash) return url.href;
  url.hostname = url.hostname.replace(/^www\./, '');
  url.pathname = url.pathname.replace(/\/$/, '') || '/';
  return url.href;
}

function matchedUrlLinks(url: URL, type: 'movie' | 'tv', region: string): DirectWatchLink[] {
  return urlRules(type)
    .filter(
      (rule) =>
        rule.hosts.includes(url.hostname) &&
        rule.path.test(url.pathname) &&
        (!rule.regions || rule.regions.includes(region)),
    )
    .flatMap((rule) =>
      rule.providerIds.map((providerId) => ({
        providerId,
        types: rule.types,
        regions: [region],
        url: `${url.origin}${url.pathname}`,
      })),
    );
}

export function wikidataUrlLinks(
  claims: Record<string, unknown>,
  type: 'movie' | 'tv',
  region: string,
  today: string,
): DirectWatchLink[] {
  const groups = new Map<
    string,
    {
      link: DirectWatchLink;
      statements: ReturnType<typeof wikidataStatements>;
      destinations: Map<string, string>;
    }
  >();
  for (const property of ['P856', 'P953', 'P973']) {
    for (const statement of wikidataStatements(claims[property], 'url', region, today)) {
      for (const link of linksFromUrl(statement.value, property, type, region)) {
        for (const offerType of link.types) {
          const key = `${link.providerId}:${offerType}`;
          const group = groups.get(key) ?? {
            link: { ...link, types: [offerType] },
            statements: [],
            destinations: new Map<string, string>(),
          };
          const identity = destinationIdentity(link.url);
          group.statements.push({ ...statement, value: identity });
          group.destinations.set(identity, link.url);
          groups.set(key, group);
        }
      }
    }
  }
  return [...groups.values()].flatMap(({ link, statements, destinations }) => {
    const identity = uniqueWikidataValue(statements);
    const url = identity ? destinations.get(identity) : undefined;
    return url ? [{ ...link, url }] : [];
  });
}
