'use server';

import {
  createSearchEngine,
  type SearchMoviesResult,
  type SearchTvShowsResult,
  type SearchPersonsResult,
  type SearchMultiResult,
} from '@movies/api/search-engine';
import { MultiSearchResponse, SearchedMovieResponse } from '@movies/api/tmdb-types/movie';
import { SearchedPersonResponse } from '@movies/api/tmdb-types/person';
import { SearchedTvResponse } from '@movies/api/tmdb-types/tv-show';
import { cacheLife, cacheTag } from 'next/cache';

import { CACHE_TAGS } from './cache-tags';
import { hydrateSearchIndexHits, searchIndexFuzzy } from './search-index';
import { addPosterImageUrls, addProfileImageUrls, tmdbFetch } from './tmdb';

async function fetchMoviesBySearchQuery(query: string, page: string, year?: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.search);
  cacheLife('hours');

  const movies = await tmdbFetch<SearchedMovieResponse>('/search/movie', {
    searchParams: {
      query,
      page,
      include_adult: 'false',
      include_video: 'false',
      primary_release_year: year,
    },
    errorMessage: 'Failed fetching searched movies',
  });
  return {
    movies: movies.results,
    totalPages: movies.total_pages,
    totalResults: movies.total_results,
  };
}

async function fetchTvShowsBySearchQuery(query: string, page: string, year?: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.search);
  cacheLife('hours');

  const tvShows = await tmdbFetch<SearchedTvResponse>('/search/tv', {
    searchParams: {
      query,
      page,
      include_adult: 'false',
      first_air_date_year: year,
    },
    errorMessage: 'Failed fetching searched TV shows',
  });
  return {
    tvShows: tvShows.results,
    totalPages: tvShows.total_pages,
    totalResults: tvShows.total_results,
  };
}

async function fetchPersonsBySearchQuery(query: string, page: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.search);
  cacheLife('hours');

  const persons = await tmdbFetch<SearchedPersonResponse>('/search/person', {
    searchParams: {
      query,
      page,
      include_adult: 'false',
    },
    errorMessage: 'Failed fetching searched persons',
  });
  return {
    persons: persons.results,
    totalPages: persons.total_pages,
    totalResults: persons.total_results,
  };
}

async function fetchMultiSearchQuery(query: string, page: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.search);
  cacheLife('hours');

  const results = await tmdbFetch<MultiSearchResponse>('/search/multi', {
    searchParams: {
      query,
      page,
      include_adult: 'false',
    },
    errorMessage: 'Failed fetching multi search results',
  });
  return { results: results.results, totalPages: results.total_pages };
}

function searchEngine() {
  return createSearchEngine({
    movies: fetchMoviesBySearchQuery,
    tv: fetchTvShowsBySearchQuery,
    persons: fetchPersonsBySearchQuery,
    multi: fetchMultiSearchQuery,
    fuzzy: searchIndexFuzzy,
    hydrate: hydrateSearchIndexHits,
    poster: addPosterImageUrls,
    profile: addProfileImageUrls,
  });
}
export async function getSearchMovies(query: string, page = 1): Promise<SearchMoviesResult> {
  return searchEngine().getSearchMovies(query, page);
}
export async function getSearchTvShows(query: string, page = 1): Promise<SearchTvShowsResult> {
  return searchEngine().getSearchTvShows(query, page);
}
export async function getSearchPersons(query: string, page = 1): Promise<SearchPersonsResult> {
  return searchEngine().getSearchPersons(query, page);
}
export async function getSearchMulti(query: string, page = 1): Promise<SearchMultiResult> {
  return searchEngine().getSearchMulti(query, page);
}
export async function getSearchSuggestions(query: string): Promise<SearchMultiResult> {
  return searchEngine().getSearchSuggestions(query);
}
