import 'server-only';
import type { MediaCard } from '@movies/api/home';

export type TmdbCard = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
};
export function tmdbImageUrl(path: string | null, size: string) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
export function toMediaCard(item: TmdbCard, type: MediaCard['type']): MediaCard {
  return {
    id: item.id,
    type,
    title: item.title ?? item.name ?? '',
    releaseDate: item.release_date ?? item.first_air_date ?? '',
    posterUrl: tmdbImageUrl(item.poster_path, 'w342'),
    backdropUrl: tmdbImageUrl(item.backdrop_path, 'w780'),
    rating: item.vote_average,
  };
}
