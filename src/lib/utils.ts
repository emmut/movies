import { Movie, SearchedMovie } from '@/types/Movie';
import { IMAGE_CDN_URL } from './constants';

export function formatDateYear(date: string) {
  return date.split('-')?.[0];
}

export function formatImageUrl(path: string | null, width = 500) {
  if (path === null) {
    return '';
  }
  return `${IMAGE_CDN_URL}w${width}${path}`;
}

export function castSearchedMovieToMovie(searchedMovie: SearchedMovie) {
  const movie: Movie = {
    adult: searchedMovie.adult,
    backdrop_path: searchedMovie.backdrop_path,
    id: searchedMovie.id,
    title: searchedMovie.name,
    original_language: searchedMovie.original_language,
    original_title: searchedMovie.original_name,
    overview: searchedMovie.overview,
    poster_path: searchedMovie.poster_path,
  };
  return movie;
}
