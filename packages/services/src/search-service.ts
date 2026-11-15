import 'server-only';
import type { SearchService } from '@movies/api/router';
import type { SearchInput, SearchPage, SearchItem } from '@movies/api/search';
import { createSearchEngine, type SearchSources } from '@movies/api/search-engine';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import type { MultiSearchResult } from '@movies/api/tmdb-types/movie';
import { tmdbImageUrl, toMediaCard } from '@movies/services/media-card';
import { createSearchSources } from '@movies/services/search-sources';

function searchCard(item: MultiSearchResult): SearchItem {
  if (item.media_type === 'person') {
    return {
      id: item.id,
      type: 'person',
      name: item.name,
      profileUrl: tmdbImageUrl(item.profile_path, 'w342'),
      department: item.known_for_department,
      knownFor: item.known_for.map((credit) => credit.title ?? credit.name ?? '').filter(Boolean),
    };
  }
  return toMediaCard(item, item.media_type);
}

async function noIndex() {
  return [];
}

const MAX_TMDB_PAGES = 500;

/** TMDB refuses pages beyond 500 even when it reports more. */
function reachablePages(totalPages: number) {
  return Math.min(MAX_TMDB_PAGES, totalPages);
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
        totalPages: reachablePages(page.totalPages),
      };
    }
    if (input.type === 'tv') {
      const page = await engine.getSearchTvShows(input.query, input.page);
      return {
        items: page.tvShows.map((item) => toMediaCard(item, 'tv')),
        totalPages: reachablePages(page.totalPages),
      };
    }
    if (input.type === 'person') {
      const page = await engine.getSearchPersons(input.query, input.page);
      return {
        items: page.persons.map((item) => searchCard({ ...item, media_type: 'person' })),
        totalPages: reachablePages(page.totalPages),
      };
    }
    const page = await engine.getSearchMulti(input.query, input.page);
    return { items: page.results.map(searchCard), totalPages: reachablePages(page.totalPages) };
  }
  async function suggestions({ query }: { query: string }): Promise<SearchPage> {
    const page = await engine.getSearchSuggestions(query);
    return {
      items: page.results.slice(0, 6).map(searchCard),
      totalPages: reachablePages(page.totalPages),
    };
  }
  return { list, suggestions };
}
