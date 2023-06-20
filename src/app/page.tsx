import { env } from 'process';
import { Suspense } from 'react';
import SectionTitle from '@/components/SectionTitle';
import Trending from '@/components/Trending';
import { Movie, MovieResponse } from '@/types/Movies';
import MovieCard from '@/components/MovieCard';

async function getTrendingMovies() {
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

async function getNowPlayingMovies() {
  const res = await fetch(
    'https://api.themoviedb.org/3/movie/now_playing?region=SE',
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
    throw new Error('Failed loading now playing movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

async function fetchTopRatedMovies() {
  const res = await fetch(
    'https://api.themoviedb.org/3/discover/movie?sort_by=vote_average.desc&region=SE',
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
  const [first, second] = await getTrendingMovies();
  const nowPlaying = await getNowPlayingMovies();
  const topRated = await fetchTopRatedMovies();

  return (
    <div className="">
      <SectionTitle>Home</SectionTitle>

      <h3 className="mb-3 mt-5 text-xl font-semibold">Trending</h3>
      <div className="flex">
        <Suspense fallback="Loading...">
          <Trending movie={first} />
        </Suspense>
        <Suspense fallback="Loading...">
          <Trending movie={second} />
        </Suspense>
      </div>

      <h3 className="mb-3 mt-5 text-xl font-semibold">Now playing</h3>
      <div className="flex snap-x space-x-4 overflow-x-auto">
        {nowPlaying.map((movie: Movie) => (
          <Suspense key={movie.id} fallback="Loading...">
            <MovieCard movie={movie} />
          </Suspense>
        ))}
      </div>

      <h3 className="mb-3 mt-5 text-xl font-semibold">Top Rated</h3>
      <div className="flex snap-x space-x-4 overflow-x-auto">
        <Suspense fallback="Loading...">
          {topRated.map((movie: Movie) => (
            <Suspense key={movie.id} fallback="Loading...">
              <MovieCard movie={movie} />
            </Suspense>
          ))}
        </Suspense>
      </div>
    </div>
  );
}
