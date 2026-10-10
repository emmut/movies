import 'server-only';
import type { SearchService } from '@movies/api/router';
import type { SearchInput, SearchPage, SearchItem } from '@movies/api/search';
import { createSearchEngine, type SearchSources } from '@movies/api/search-engine';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import type { MultiSearchResult } from '@movies/api/tmdb-types/movie';
import { tmdbImageUrl, toMediaCard } from '@server/media-card';
import { createSearchSources } from '@server/search-sources';

function searchCard(item: MultiSearchResult): SearchItem {
  if (item.media_type === 'person')
    return {
      id: item.id,
      type: 'person',
      name: item.name,
      profileUrl: tmdbImageUrl(item.profile_path, 'w342'),
      department: item.known_for_department,
      knownFor: item.known_for.map((credit) => credit.title ?? credit.name ?? '').filter(Boolean),
    };
  return toMediaCard(item, item.media_type);
}
async function noIndex() {
  return [];
}

export function createSearchService(
  fetchTmdb: TmdbFetch,
  fuzzy: SearchSources['fuzzy'] = noIndex,
): SearchService {
  const engine = createSearchEngine(createSearchSources(fetchTmdb, fuzzy));
  async function list(input: SearchInput): Promise<SearchPage> {
    if (input.type === 'movie') {
      const page = await engine.getSearchMovies(input.query, input.page);
      return {
        items: page.movies.map((item) => toMediaCard(item, 'movie')),
        totalPages: Math.min(500, page.totalPages),
      };
    }
    if (input.type === 'tv') {
      const page = await engine.getSearchTvShows(input.query, input.page);
      return {
        items: page.tvShows.map((item) => toMediaCard(item, 'tv')),
        totalPages: Math.min(500, page.totalPages),
      };
    }
    if (input.type === 'person') {
      const page = await engine.getSearchPersons(input.query, input.page);
      return {
        items: page.persons.map((item) => searchCard({ ...item, media_type: 'person' })),
        totalPages: Math.min(500, page.totalPages),
      };
    }
    const page = await engine.getSearchMulti(input.query, input.page);
    return { items: page.results.map(searchCard), totalPages: Math.min(500, page.totalPages) };
  }
  return { list };
}
