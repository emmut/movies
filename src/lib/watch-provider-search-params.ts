import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server';
import { DEFAULT_REGION } from './regions';

export const loadWatchProviderSearchParams = createLoader({
  with_watch_providers: parseAsArrayOf(parseAsInteger).withDefault([]),
  watch_region: parseAsString.withDefault(DEFAULT_REGION),
});
