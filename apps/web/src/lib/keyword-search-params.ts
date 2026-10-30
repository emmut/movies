import { createLoader, parseAsInteger, parseAsStringLiteral } from 'nuqs/server';

export const loadKeywordSearchParams = createLoader({
  page: parseAsInteger.withDefault(1),
  mediaType: parseAsStringLiteral(['movie', 'tv'] as const).withDefault('movie'),
});
