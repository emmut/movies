import 'server-only';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import type { MovieDetails } from '@movies/api/tmdb-types/movie';
import type { TvDetails } from '@movies/api/tmdb-types/tv-show';
import type { TitleSource } from '@movies/db/title-sync';

export function createTitleSource(fetchTmdb: TmdbFetch): TitleSource {
  return {
    movieDetails: (id) => fetchTmdb<MovieDetails>('/movie/' + id),
    tvDetails: (id) => fetchTmdb<TvDetails>('/tv/' + id),
    movieWatchProviders: (id) => fetchTmdb('/movie/' + id + '/watch/providers'),
    tvWatchProviders: (id) => fetchTmdb('/tv/' + id + '/watch/providers'),
  };
}
