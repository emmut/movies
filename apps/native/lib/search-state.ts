import { searchInput, type SearchInput } from '@movies/api/search';

type Params = Record<string, string | string[] | undefined>;
type SearchState = { query: string; type: SearchInput['type']; page: number };
function scalar(value: Params[string]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
export function readSearchState(params: Params): SearchState {
  const query = (scalar(params.q) ?? '').trim().slice(0, 500);
  const type = searchInput.shape.type.safeParse(scalar(params.mediaType));
  const page = searchInput.shape.page.safeParse(Number(scalar(params.page) ?? 1));
  return {
    query,
    type: type.success ? type.data : 'all',
    page: page.success ? page.data : 1,
  };
}
