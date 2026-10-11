import {
  systemListPageInput,
  type SystemListPage,
  type SystemListPageInput,
} from '@movies/api/system-lists';
import type { SystemListType } from '@movies/api/validations';
import {
  providerIdList,
  regionOr,
  scalar,
  type SearchParams as Params,
} from '@native/lib/search-params';

function positivePage(value: Params[string]) {
  const page = Number(scalar(value));
  if (Number.isSafeInteger(page) && page > 0) {
    return page;
  }
  return 1;
}
function uniqueProviderIds(value: Params[string]) {
  return [...new Set(providerIdList(value))];
}
export function readSystemListState(
  params: Params,
  listType: SystemListType,
  accountRegion: string,
) {
  return systemListPageInput.parse({
    listType,
    resourceType: scalar(params.mediaType) === 'tv' ? 'tv' : 'movie',
    page: positivePage(params.page),
    providerIds: uniqueProviderIds(params.with_watch_providers),
    region: regionOr(params.watch_region, accountRegion),
  });
}
export function canReorderSystemList(
  input: SystemListPageInput,
  result: SystemListPage,
  stale: boolean,
) {
  if (input.providerIds.length > 0) {
    return false;
  }
  if (stale || result.unavailableItems > 0) {
    return false;
  }
  return result.totalItems > 1;
}
