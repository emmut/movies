import { env } from '@/env';
import type { MovieResponse } from '@/types/Movie';

export async function fetchTrendingMovies() {
  const res = await fetch('https://api.themoviedb.org/3/trending/movie/day', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
    next: {
      revalidate: 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading trending movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export async function fetchNowPlayingMovies() {
  const res = await fetch('https://api.themoviedb.org/3/movie/now_playing', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
    next: {
      revalidate: 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading now playing movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export async function fetchUpcomingMovies() {
  const [upcomingRes, nowPlayingMovies] = await Promise.all([
    fetch('https://api.themoviedb.org/3/movie/upcoming', {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
      next: {
        revalidate: 60 * 5,
      },
    }),
    fetchNowPlayingMovies(),
  ]);

  if (!upcomingRes.ok) {
    throw new Error('Failed loading upcoming movies');
  }

  const upcomingMovies: MovieResponse = await upcomingRes.json();

  // Filter out movies that are already in now playing
  const nowPlayingIds = new Set(nowPlayingMovies.map((movie) => movie.id));
  const filteredUpcomingMovies = upcomingMovies.results.filter(
    (movie) => !nowPlayingIds.has(movie.id)
  );

  return filteredUpcomingMovies;
}
