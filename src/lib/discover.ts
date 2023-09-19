import { env } from 'process';
import type { GenreResponse } from '@/types/Genre';
import { MovieResponse } from '@/types/Movie';

export async function fetchAvailableGenres() {
  const res = await fetch('https://api.themoviedb.org/3/genre/movie/list', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
    next: {
      revalidate: 60 * 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading genres');
  }

  const movies: GenreResponse = await res.json();
  return movies.genres;
}

export async function fetchDiscoverMovies(genreId: number, page: number = 1) {
  let url = `https://api.themoviedb.org/3/discover/movie?page=${page}&sort_by=polularity.desc&region=SE&include_adult=false&include_video=false`;

  if (genreId !== 0) {
    url += `&with_genres=${genreId}`;
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
    next: {
      revalidate: 60 * 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading discover movies');
  }

  const movies: MovieResponse = await res.json();
  return movies;
}
