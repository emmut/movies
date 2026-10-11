import {
  systemListPageInput,
  type SystemListPage,
  type SystemListPageInput,
} from '@movies/api/system-lists';
import type { SystemListType } from '@movies/api/validations';
import { regionSchema } from '@movies/config/regions';

type Params = Record<string, string | string[] | undefined>;
function scalar(value: Params[string]) {
  return Array.isArray(value) ? value[0] : value;
}
function positivePage(value: Params[string]) {
  const page = Number(scalar(value));
  if (Number.isSafeInteger(page) && page > 0) {
    return page;
  }
  return 1;
}
function providerIds(value: Params[string]) {
  const ids = (scalar(value) ?? '')
    .split(/[|,]/)
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0 && id <= 2_147_483_647);
  return [...new Set(ids)];
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
    providerIds: providerIds(params.with_watch_providers),
    region: regionSchema.safeParse(scalar(params.watch_region)).data ?? accountRegion,
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
