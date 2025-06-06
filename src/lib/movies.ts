import { env } from '@/env';
import type { GenreResponse } from '@/types/Genre';
import {
  MovieCredits,
  MovieDetails,
  MovieResponse,
  MovieWatchProviders,
} from '@/types/Movie';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';

export async function fetchAvailableGenres() {
  'use cache';
  cacheTag('genres');
  cacheLife('days');

  const res = await fetch('https://api.themoviedb.org/3/genre/movie/list', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading genres');
  }

  const movies: GenreResponse = await res.json();
  return movies.genres;
}

export async function fetchDiscoverMovies(genreId: number, page: number = 1) {
  'use cache';
  cacheTag('discover');
  cacheLife('minutes');

  const url = new URL('https://api.themoviedb.org/3/discover/movie');
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort_by', 'popularity.desc');
  url.searchParams.set('region', 'SE');
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('include_video', 'false');

  if (genreId !== 0) {
    url.searchParams.set('with_genres', String(genreId));
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading discover movies');
  }

  const movies: MovieResponse = await res.json();
  const totalPages = movies.total_pages >= 500 ? 500 : movies.total_pages;
  return { movies: movies.results, totalPages };
}

export async function fetchUpcomingMovies() {
  'use cache';
  cacheTag('upcoming');
  cacheLife('minutes');

  const res = await fetch('https://api.themoviedb.org/3/movie/upcoming', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading upcoming movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export async function getMovieDetails(movieId: number) {
  'use cache';
  cacheTag('movie-details');
  cacheLife('minutes');

  const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading movie details');
  }

  const movie: MovieDetails = await res.json();

  return movie;
}

export async function getMovieCredits(movieId: number) {
  'use cache';
  cacheTag('movie-credits');
  cacheLife('minutes');

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/credits`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed loading movie credits');
  }

  const credits: MovieCredits = await res.json();
  return credits;
}

export async function getMovieWatchProviders(movieId: number) {
  'use cache';
  cacheTag('movie-watch-providers');
  cacheLife('minutes');

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed loading movie watch providers');
  }

  const watchProviders: MovieWatchProviders = await res.json();
  return watchProviders;
}
