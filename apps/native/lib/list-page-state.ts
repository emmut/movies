import { regionPreferenceSchema } from '@movies/api/preferences';
import type { SystemListPage, SystemListPageInput } from '@movies/api/system-lists';
import { providerIdList, regionOr, scalar, type SearchParams } from '@native/lib/search-params';

export function listPage(value: SearchParams[string]) {
  const page = Number(scalar(value));
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
export function readListPageState(params: SearchParams, accountRegion: string) {
  return {
    page: listPage(params.page),
    providerIds: [...new Set(providerIdList(params.with_watch_providers))],
    region: regionPreferenceSchema.shape.region.parse(regionOr(params.watch_region, accountRegion)),
  };
}

export function canReorderList(
  input: Pick<SystemListPageInput, 'providerIds'>,
  result: Pick<SystemListPage, 'unavailableItems' | 'totalItems'>,
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
