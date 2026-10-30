import type { SearchIndexHit } from './search-index-model';
import { fulfilledValues } from './settled';
import type { MovieDetails, MultiSearchResult } from './tmdb-types/movie';
import type { PersonDetails } from './tmdb-types/person';
import type { TvDetails } from './tmdb-types/tv-show';

type MovieSearchDetails = Omit<MovieDetails, 'production_companies' | 'belongs_to_collection'>;
type TvSearchDetails = Omit<
  TvDetails,
  'production_companies' | 'seasons' | 'next_episode_to_air' | 'last_episode_to_air'
>;

export type SearchDetailSources = {
  movie(id: number): Promise<MovieSearchDetails>;
  tv(id: number): Promise<TvSearchDetails>;
  person(id: number): Promise<PersonDetails>;
};
export function createSearchHydrator(sources: SearchDetailSources) {
  const { movie: getMovieDetails, tv: getTvShowDetails, person: getPersonDetails } = sources;
  function movieResult(details: MovieSearchDetails): MultiSearchResult {
    return {
      adult: details.adult,
      backdrop_path: details.backdrop_path,
      id: details.id,
      title: details.title,
      original_language: details.original_language,
      original_title: details.original_title,
      overview: details.overview,
      poster_path: details.poster_path,
      media_type: 'movie',
      genre_ids: (details.genres ?? []).map((genre) => genre.id),
      popularity: details.popularity,
      release_date: details.release_date,
      video: details.video,
      vote_average: details.vote_average,
      vote_count: details.vote_count,
    };
  }

  function tvResult(details: TvSearchDetails): MultiSearchResult {
    return {
      id: details.id,
      name: details.name,
      original_name: details.original_name,
      overview: details.overview,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      vote_average: details.vote_average,
      vote_count: details.vote_count,
      first_air_date: details.first_air_date,
      genre_ids: (details.genres ?? []).map((genre) => genre.id),
      popularity: details.popularity,
      media_type: 'tv',
      origin_country: details.origin_country,
      original_language: details.original_language,
    };
  }

  function personResult(details: PersonDetails): MultiSearchResult {
    return {
      id: details.id,
      name: details.name,
      profile_path: details.profile_path,
      popularity: details.popularity,
      known_for_department: details.known_for_department,
      known_for: details.known_for ?? [],
      media_type: 'person',
    };
  }

  /**
   * Turns an index hit into the shape TMDB's search endpoints return, using the
   * cached details fetchers — the index stores no metadata of its own.
   */
  async function hydrateHit(hit: SearchIndexHit): Promise<MultiSearchResult> {
    if (hit.mediaType === 'movie') {
      return movieResult(await getMovieDetails(hit.tmdbId));
    }
    if (hit.mediaType === 'tv') {
      return tvResult(await getTvShowDetails(hit.tmdbId));
    }
    return personResult(await getPersonDetails(hit.tmdbId));
  }

  /**
   * Hydrates already-ranked index hits, preserving their order. Keeping this
   * separate from retrieval lets hybrid search reuse TMDB results it already
   * has and pay details-call latency only for local candidates TMDB missed.
   */
  async function hydrateSearchIndexHits(hits: SearchIndexHit[]): Promise<MultiSearchResult[]> {
    return await fulfilledValues(hits, hydrateHit);
  }

  return { hydrateSearchIndexHits };
}
