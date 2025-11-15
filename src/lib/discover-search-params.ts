import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';

export const loadDiscoverSearchParams = createLoader({
  page: parseAsInteger.withDefault(1),
  genreId: parseAsInteger.withDefault(0),
  mediaType: parseAsStringLiteral(['movie', 'tv'] as const).withDefault(
    'movie'
  ),
  sort_by: parseAsString.withDefault('popularity.desc'),
  with_watch_providers: parseAsArrayOf(parseAsInteger).withDefault([]),
  watch_region: parseAsString,
  runtime: parseAsInteger,
});
