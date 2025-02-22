import { env } from '@/env';
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
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(page));
  searchParams.set('sort_by', 'popularity.desc');
  searchParams.set('region', 'SE');
  searchParams.set('include_adult', 'false');
  searchParams.set('include_video', 'false');

  let url = `https://api.themoviedb.org/3/discover/movie?${searchParams.toString()}`;

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
  const totalPages = movies.total_pages >= 500 ? 500 : movies.total_pages;
  return { movies: movies.results, totalPages };
}
