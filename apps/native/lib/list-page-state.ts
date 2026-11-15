import { regionPreferenceSchema } from '@movies/api/preferences';
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
