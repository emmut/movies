import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';

export const loadDiscoverSearchParams = createLoader(
  {
    page: parseAsInteger.withDefault(1),
    genreIds: parseAsArrayOf(parseAsInteger).withDefault([]),
    mediaType: parseAsStringLiteral(['movie', 'tv'] as const).withDefault('movie'),
    sort_by: parseAsString.withDefault('popularity.desc'),
    with_watch_providers: parseAsArrayOf(parseAsInteger).withDefault([]),
    with_origin_country: parseAsArrayOf(parseAsString).withDefault([]),
    watch_region: parseAsString,
    runtime: parseAsInteger,
  },
  {
    // Keep the historical `genreId` URL key so old links (`?genreId=28`)
    // and detail-page genre links keep working; the value is a comma list.
    urlKeys: { genreIds: 'genreId' },
  },
);
