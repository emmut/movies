import { env } from '@/env';
import type { GenreResponse } from '@/types/Genre';
import {
  MovieCredits,
  MovieDetails,
  MovieResponse,
  MovieWatchProviders,
} from '@/types/Movie';

export async function fetchAvailableGenres() {
  const res = await fetch('https://api.themoviedb.org/3/genre/movie/list', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
    next: {
      revalidate: 60 * 60 * 24,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading genres');
  }

  const movies: GenreResponse = await res.json();
  return movies.genres;
}

export async function fetchDiscoverMovies(genreId: number, page: number = 1) {
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
    next: {
      revalidate: 60 * 60 * 5,
      tags: ['discover'],
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
  const res = await fetch('https://api.themoviedb.org/3/movie/upcoming', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
    next: {
      revalidate: 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading upcoming movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export async function getMovieDetails(movieId: number) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
    next: {
      revalidate: 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading movie details');
  }

  const movie: MovieDetails = await res.json();

  return movie;
}

export async function getMovieCredits(movieId: number): Promise<MovieCredits> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/credits`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
      next: {
        revalidate: 60 * 60,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed loading movie credits');
  }

  const credits: MovieCredits = await res.json();
  return credits;
}

export async function getMovieWatchProviders(
  movieId: number
): Promise<MovieWatchProviders> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
      next: {
        revalidate: 60 * 30,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed loading movie watch providers');
  }

  const watchProviders: MovieWatchProviders = await res.json();
  return watchProviders;
}
