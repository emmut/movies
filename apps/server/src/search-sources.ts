import 'server-only';
import type { SearchSources } from '@movies/api/search-engine';
import { createSearchHydrator } from '@movies/api/search-hydration';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import {
  searchedMovieSchema,
  searchedTvSchema,
  searchedPersonSchema,
  searchedMultiSchema,
  tmdbSearchPageSchema,
  movieDetailsSchema,
  tvDetailsSchema,
  personDetailsSchema,
} from '@server/tmdb-search-model';

function unchanged<T>(value: T) {
  return value;
}

export function createSearchSources(
  fetchTmdb: TmdbFetch,
  fuzzy: SearchSources['fuzzy'],
): SearchSources {
  const hydrator = createSearchHydrator({
    async movie(id) {
      return movieDetailsSchema.parse(await fetchTmdb('/movie/' + id));
    },
    async tv(id) {
      return tvDetailsSchema.parse(await fetchTmdb('/tv/' + id));
    },
    async person(id) {
      return personDetailsSchema.parse(await fetchTmdb('/person/' + id));
    },
  });
  return {
    async movies(query, page, year) {
      const data = tmdbSearchPageSchema(searchedMovieSchema).parse(
        await fetchTmdb('/search/movie', {
          searchParams: {
            query,
            page,
            include_adult: 'false',
            include_video: 'false',
            primary_release_year: year,
          },
        }),
      );
      return {
        movies: data.results,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    },
    async tv(query, page, year) {
      const data = tmdbSearchPageSchema(searchedTvSchema).parse(
        await fetchTmdb('/search/tv', {
          searchParams: { query, page, include_adult: 'false', first_air_date_year: year },
        }),
      );
      return {
        tvShows: data.results,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    },
    async persons(query, page) {
      const data = tmdbSearchPageSchema(searchedPersonSchema).parse(
        await fetchTmdb('/search/person', {
          searchParams: { query, page, include_adult: 'false' },
        }),
      );
      return {
        persons: data.results,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    },
    async multi(query, page) {
      const data = tmdbSearchPageSchema(searchedMultiSchema).parse(
        await fetchTmdb('/search/multi', {
          searchParams: { query, page, include_adult: 'false' },
        }),
      );
      return { results: data.results, totalPages: data.total_pages };
    },
    fuzzy,
    hydrate: hydrator.hydrateSearchIndexHits,
    poster: unchanged,
    profile: unchanged,
  };
}
