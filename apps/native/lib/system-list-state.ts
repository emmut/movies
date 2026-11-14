import { systemListPageInput } from '@movies/api/system-lists';
import type { SystemListType } from '@movies/api/validations';
import { readListPageState } from '@native/lib/list-page-state';
import { scalar, type SearchParams as Params } from '@native/lib/search-params';

export function readSystemListState(
  params: Params,
  listType: SystemListType,
  accountRegion: string,
) {
  return systemListPageInput.parse({
    listType,
    resourceType: scalar(params.mediaType) === 'tv' ? 'tv' : 'movie',
    ...readListPageState(params, accountRegion),
  });
}
