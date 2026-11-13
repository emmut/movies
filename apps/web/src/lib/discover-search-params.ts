import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';

export const discoverSearchParsers = {
  page: parseAsInteger.withDefault(1),
  networkIds: parseAsArrayOf(parseAsInteger).withDefault([]),
  companyIds: parseAsArrayOf(parseAsInteger).withDefault([]),
  keywordIds: parseAsArrayOf(parseAsInteger).withDefault([]),
  genreIds: parseAsArrayOf(parseAsInteger).withDefault([]),
  mediaType: parseAsStringLiteral(['movie', 'tv'] as const).withDefault('movie'),
  sort_by: parseAsString.withDefault('popularity.desc'),
  with_watch_providers: parseAsArrayOf(parseAsInteger).withDefault([]),
  with_origin_country: parseAsArrayOf(parseAsString).withDefault([]),
  watch_region: parseAsString,
  runtime: parseAsInteger,
};

// Preserve historical URL keys for existing links and detail-page filters.
export const discoverSearchUrlKeys = {
  genreIds: 'genreId',
  keywordIds: 'keywordId',
  companyIds: 'companyId',
  networkIds: 'networkId',
} as const;

export const loadDiscoverSearchParams = createLoader(discoverSearchParsers, {
  urlKeys: discoverSearchUrlKeys,
});
