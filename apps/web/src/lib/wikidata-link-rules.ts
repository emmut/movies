import { z } from 'zod';

import type { WatchOfferType } from '@/types/watch-provider';

type WikidataLinkRule = {
  property: string;
  providerIds: number[];
  types: WatchOfferType[];
  schema: z.ZodType<string>;
  prefix: string;
  suffix?: string;
  regions?: string[];
};

const uuid = z.uuid();
const numeric = z.string().regex(/^[1-9]\d{0,15}$/);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const subscription: WatchOfferType[] = ['flatrate'];
const transactional: WatchOfferType[] = ['rent', 'buy'];
const streaming: WatchOfferType[] = ['flatrate', 'free', 'ads'];

/** Reviewed property formats; sources and TMDB provider IDs are listed in docs/streaming-links.md. */
export function wikidataLinkRules(type: 'movie' | 'tv'): WikidataLinkRule[] {
  return [
    {
      property: 'P1874',
      providerIds: [8, 175, 1796],
      types: subscription,
      schema: z.string().regex(/^\d{6,8}$/),
      prefix: 'https://www.netflix.com/title/',
    },
    {
      property: 'P13902',
      providerIds: [337, 122],
      types: subscription,
      schema: z.templateLiteral(['entity-', uuid]),
      prefix: 'https://www.disneyplus.com/browse/',
    },
    {
      property: type === 'movie' ? 'P9586' : 'P9751',
      providerIds: [350],
      types: subscription,
      schema: z.string().regex(/^umc\.cmc\.[a-z0-9]{22,25}$/),
      prefix: `https://tv.apple.com/${type === 'movie' ? 'movie' : 'show'}/`,
    },
    {
      property: type === 'movie' ? 'P9586' : 'P9751',
      providerIds: [2],
      types: transactional,
      schema: z.string().regex(/^umc\.cmc\.[a-z0-9]{22,25}$/),
      prefix: `https://tv.apple.com/${type === 'movie' ? 'movie' : 'show'}/`,
    },
    {
      property: type === 'movie' ? 'P6466' : 'P6467',
      providerIds: [15],
      types: subscription,
      schema: uuid,
      prefix: `https://www.hulu.com/${type === 'movie' ? 'movie' : 'series'}/`,
      regions: ['US'],
    },
    // P14440 and GTI are international identities. P8055 is explicitly the US catalogue.
    {
      property: 'P14440',
      providerIds: [9, 119, 2100, 613],
      types: streaming,
      schema: z.string().regex(/^[0-9A-Z]{26}$/),
      prefix: 'https://www.primevideo.com/detail/',
    },
    {
      property: 'P14462',
      providerIds: [9, 119, 2100, 613],
      types: streaming,
      schema: z.templateLiteral(['amzn1.dv.gti.', uuid]),
      prefix: 'https://www.primevideo.com/detail/',
    },
    {
      property: 'P14440',
      providerIds: [10],
      types: transactional,
      schema: z.string().regex(/^[0-9A-Z]{26}$/),
      prefix: 'https://www.primevideo.com/detail/',
    },
    {
      property: 'P14462',
      providerIds: [10],
      types: transactional,
      schema: z.templateLiteral(['amzn1.dv.gti.', uuid]),
      prefix: 'https://www.primevideo.com/detail/',
    },
    {
      property: 'P8055',
      providerIds: [9, 119, 2100, 613],
      types: streaming,
      schema: z.string().regex(/^B[0-9A-Z]{9}$/),
      prefix: 'https://www.amazon.com/gp/video/detail/',
      regions: ['US'],
    },
    {
      property: 'P8055',
      providerIds: [10],
      types: transactional,
      schema: z.string().regex(/^B[0-9A-Z]{9}$/),
      prefix: 'https://www.amazon.com/gp/video/detail/',
      regions: ['US'],
    },
    {
      property: 'P8298',
      providerIds: [1899],
      types: subscription,
      schema:
        type === 'movie'
          ? z.union([
              z.templateLiteral([z.enum(['movie/', 'feature/']), uuid]),
              z.string().regex(/^(movie|feature)\/urn:hbo:\1:[A-Za-z0-9_-]{21}$/),
            ])
          : z.union([
              z.templateLiteral([z.enum(['show/', 'shows/', 'series/']), uuid]),
              z.string().regex(/^(show|shows|series)\/urn:hbo:\1:[A-Za-z0-9_-]{21}$/),
            ]),
      prefix: 'https://play.hbomax.com/',
    },
    {
      property: 'P7299',
      providerIds: [11],
      types: [...streaming, ...transactional],
      schema: numeric,
      prefix: 'https://mubi.com/films/',
    },
    {
      property: type === 'movie' ? 'P7760' : 'P7761',
      providerIds: [73],
      types: ['free', 'ads'],
      schema: numeric,
      prefix: `https://tubitv.com/${type === 'movie' ? 'movies' : 'series'}/`,
    },
    {
      property: 'P11815',
      providerIds: [386, 387],
      types: streaming,
      schema: z
        .string()
        .regex(
          type === 'movie'
            ? /^movies\/[a-z0-9]+(?:-[a-z0-9]+)*$/
            : /^tv\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
        ),
      prefix: 'https://www.peacocktv.com/stream-',
      regions: ['US'],
    },
    {
      property: 'P11682',
      providerIds: [113],
      types: [...streaming, ...transactional],
      schema: z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/),
      prefix: 'https://www.ivi.ru/watch/',
    },
    // This property identifies films/episodes, not whole TV series.
    ...movieRules(type),
    {
      property: 'P6817',
      providerIds: [493],
      types: ['free', 'ads'],
      schema: slug,
      prefix: 'https://www.svtplay.se/',
      regions: ['SE'],
    },
    {
      property: 'P9979',
      providerIds: [442],
      types: ['free', 'ads'],
      schema: z
        .string()
        .regex(type === 'movie' ? /^program\/[A-Za-z]{4}\d{8}$/ : /^serie\/[a-zA-Z0-9-]+$/),
      prefix: 'https://tv.nrk.no/',
      regions: ['NO'],
    },
    {
      property: 'P3414',
      providerIds: [323],
      types: ['free', 'ads'],
      schema: z.string().regex(/^1-\d+$/),
      prefix: 'https://areena.yle.fi/',
      regions: ['FI'],
    },
    {
      property: 'P10344',
      providerIds: [344],
      types: streaming,
      schema: z.string().regex(type === 'movie' ? /^movies\/\d+$/ : /^tv\/\d+$/),
      prefix: 'https://www.viki.com/',
    },
    {
      property: 'P11460',
      providerIds: [538],
      types: ['free', 'ads'],
      schema: z.string().regex(/^[a-f0-9]{24}$/),
      prefix:
        'https://app.plex.tv/desktop/#!/provider/tv.plex.provider.metadata/details?key=/library/metadata/',
    },
    {
      property: 'P7334',
      providerIds: [7],
      types: transactional,
      schema: numeric,
      prefix: 'https://athome.fandango.com/content/browse/details/wd/',
      regions: ['US'],
    },
    {
      property: 'P7334',
      providerIds: [332],
      types: ['free', 'ads'],
      schema: numeric,
      prefix: 'https://athome.fandango.com/content/browse/details/wd/',
      regions: ['US'],
    },
    {
      property: 'P7985',
      providerIds: [191],
      types: ['free', 'flatrate'],
      schema: slug,
      prefix: 'https://www.kanopy.com/product/',
    },
    {
      property: 'P5680',
      providerIds: [212],
      types: ['free', 'flatrate'],
      schema: numeric,
      prefix: 'https://www.hoopladigital.com/title/',
    },
    {
      property: 'P827',
      providerIds: [38],
      types: ['free', 'ads', 'flatrate'],
      schema: z.string().regex(/^[b-df-hj-np-tv-z0-9]{8,11}$/),
      prefix: 'https://www.bbc.co.uk/programmes/',
      regions: ['GB'],
    },
    {
      property: 'P11330',
      providerIds: [283],
      types: streaming,
      schema: z.string().regex(/^[A-Z0-9]{9,10}$/),
      prefix: 'https://www.crunchyroll.com/series/',
    },
    {
      property: 'P11119',
      providerIds: [222],
      types: ['free', 'ads'],
      schema: z.string().regex(/^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/),
      prefix: 'https://www.raiplay.it/programmi/',
      regions: ['IT'],
    },
    {
      property: 'P14567',
      providerIds: [84],
      types: [...streaming, ...transactional],
      schema: z.string().regex(/^SID\d{7}$/),
      prefix: 'https://video.unext.jp/title/',
      regions: ['JP'],
    },
    {
      property: 'P14599',
      providerIds: [1884],
      types: streaming,
      schema: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)+$/),
      prefix: 'https://abema.tv/video/title/',
      regions: ['JP'],
    },
    {
      property: 'P14596',
      providerIds: [2683],
      types: streaming,
      schema: z.string().regex(/^[a-z0-9]{4,12}$/),
      prefix: 'https://fod.fujitv.co.jp/title/',
      regions: ['JP'],
    },
  ];
}

function movieRules(type: 'movie' | 'tv'): WikidataLinkRule[] {
  if (type !== 'movie') return [];
  return [
    {
      property: 'P13147',
      providerIds: [531, 2303, 2304, 2616],
      types: subscription,
      schema: z.string().regex(/^(?:[A-Za-z0-9_]{32}|\d{1,20})$/),
      prefix: 'https://www.paramountplus.com/shows/video/',
      suffix: '/',
      regions: ['US'],
    },
    {
      property: 'P8928',
      providerIds: [443],
      types: ['free', 'flatrate'],
      schema: z.string().regex(/^[1-9]\d{9}$/),
      prefix: 'https://fjernleje.filmstriben.dk/film/',
      regions: ['DK'],
    },
    {
      property: 'P4606',
      providerIds: [441],
      types: ['free', 'ads', 'flatrate'],
      schema: z.string().regex(/^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/),
      prefix: 'https://www.nfb.ca/film/',
      suffix: '/',
    },
    {
      property: 'P14403',
      providerIds: [2736],
      types: ['free', 'ads', 'flatrate'],
      schema: z.string().regex(/^[1-9]\d*(?:-[a-z0-9]+)*$/),
      prefix: 'https://www.brew.tv/movie/',
    },
    {
      property: 'P14727',
      providerIds: [115],
      types: [...streaming, ...transactional],
      schema: slug,
      prefix: 'https://okko.tv/movie/',
      suffix: '/',
    },
    {
      property: 'P6398',
      providerIds: [2],
      types: transactional,
      schema: numeric,
      prefix: 'https://itunes.apple.com/us/movie/id',
      regions: ['US'],
    },
  ];
}
