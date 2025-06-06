import { env } from '@/env';
import { DEFAULT_REGION } from '@/lib/regions';
import { getUserRegion } from '@/lib/user-actions';
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

export async function fetchTrendingMovies() {
  'use cache';
  cacheTag('trending');
  cacheLife('minutes');

  const res = await fetch('https://api.themoviedb.org/3/trending/movie/day', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading trending movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

async function getUserRegionWithFallback(): Promise<string> {
  try {
    return await getUserRegion();
  } catch (error) {
    // Fallback to default region if user is not logged in or error occurs
    console.warn(
      'Could not get user region, using fallback:',
      DEFAULT_REGION,
      error
    );
    return DEFAULT_REGION;
  }
}

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
  url.searchParams.set('region', DEFAULT_REGION);
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

export async function fetchUserDiscoverMovies(
  genreId: number,
  page: number = 1
) {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL('https://api.themoviedb.org/3/discover/movie');
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort_by', 'popularity.desc');
  url.searchParams.set('region', userRegion);
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

export async function fetchNowPlayingMovies() {
  'use cache';
  cacheTag('now-playing');
  cacheLife('minutes');

  const res = await fetch('https://api.themoviedb.org/3/movie/now_playing', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading now playing movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export async function fetchUpcomingMovies() {
  'use cache';
  cacheTag('upcoming');
  cacheLife('minutes');

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

  const nowPlayingIds = new Set(nowPlayingMovies.map((movie) => movie.id));
  const filteredUpcomingMovies = upcomingMovies.results.filter(
    (movie) => !nowPlayingIds.has(movie.id)
  );

  return filteredUpcomingMovies;
}

export async function fetchUserNowPlayingMovies() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL('https://api.themoviedb.org/3/movie/now_playing');
  url.searchParams.set('region', userRegion);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading now playing movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export async function fetchUserUpcomingMovies() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL('https://api.themoviedb.org/3/movie/upcoming');
  url.searchParams.set('region', userRegion);

  const [upcomingRes, nowPlayingMovies] = await Promise.all([
    fetch(url, {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    }),
    fetchUserNowPlayingMovies(),
  ]);

  if (!upcomingRes.ok) {
    throw new Error('Failed loading upcoming movies');
  }

  const upcomingMovies: MovieResponse = await upcomingRes.json();

  const nowPlayingIds = new Set(nowPlayingMovies.map((movie) => movie.id));
  const filteredUpcomingMovies = upcomingMovies.results.filter(
    (movie) => !nowPlayingIds.has(movie.id)
  );

  return filteredUpcomingMovies;
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

  const regionProviders = watchProviders.results[DEFAULT_REGION];
  return {
    ...watchProviders,
    results: regionProviders
      ? { [DEFAULT_REGION]: regionProviders }
      : watchProviders.results,
  };
}

export async function getUserMovieWatchProviders(movieId: number) {
  const userRegion = await getUserRegionWithFallback();

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

  const regionProviders = watchProviders.results[userRegion];
  return {
    ...watchProviders,
    results: regionProviders
      ? { [userRegion]: regionProviders }
      : watchProviders.results,
  };
}
