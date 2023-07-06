import { env } from 'process';
import { Suspense } from 'react';
import TrendingCard from '@/components/TrendingCard';
import MovieCard from '@/components/MovieCard';
import type { Movie, MovieResponse } from '@/types/Movie';

async function fetchTrendingMovies() {
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

async function fetchNowPlayingMovies() {
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

async function fetchTopRatedMovies() {
  const res = await fetch(
    'https://api.themoviedb.org/3/discover/movie?sort_by=vote_average.desc&region=SE&include_adult=false&include_video=false',
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
      next: {
        revalidate: 60 * 5,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed loading now top rated movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export default async function Home() {
  const [trending, nowPlaying, topRated] = await Promise.all([
    fetchTrendingMovies(),
    fetchNowPlayingMovies(),
    fetchTopRatedMovies(),
  ]);

  const [first, second] = trending;

  return (
    <>
      <h2 className="mb-3 mt-5 text-xl font-semibold">Trending</h2>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Suspense fallback={<TrendingCard.Ghost />}>
          <TrendingCard movie={first} />
        </Suspense>
        <Suspense fallback={<TrendingCard.Ghost />}>
          <TrendingCard movie={second} />
        </Suspense>
      </div>

      <h2 className="mb-3 mt-5 text-xl font-semibold">Now playing</h2>
      <div className="flex snap-x space-x-4 overflow-x-auto">
        {nowPlaying.map((movie: Movie) => (
          <Suspense key={movie.id} fallback={<MovieCard.Ghost />}>
            <MovieCard movie={movie} />
          </Suspense>
        ))}
      </div>

      <h2 className="mb-3 mt-5 text-xl font-semibold">Top Rated</h2>
      <div className="flex snap-x space-x-4 overflow-x-auto">
        <Suspense fallback={<MovieCard.Ghost />}>
          {topRated.map((movie: Movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </Suspense>
      </div>
    </>
  );
}
