import { parseCatalogId } from '@movies/api/catalog';
import { keywordInput } from '@movies/api/pdp';
import { regionOr, scalar, type SearchParams } from '@native/lib/search-params';

export function readKeywordInput(params: SearchParams, fallbackRegion: string) {
  return keywordInput.safeParse({
    id: parseCatalogId(params.keywordId),
    type: scalar(params.mediaType) ?? 'movie',
    page: params.page === undefined ? 1 : parseCatalogId(params.page),
    region: regionOr(params.region, fallbackRegion),
  });
}
