import MovieCard from '@/components/MovieCard';
import SectionTitle from '@/components/SectionTitle';
import Spinner from '@/components/Spinner';
import { castSearchedMovieToMovie } from '@/lib/utils';
import { SearchedMovieResponse } from '@/types/Movie';
import { env } from 'process';
import { Suspense } from 'react';

type SearchProps = {
  searchParams: {
    q?: string;
  };
};

async function fetchMoviesBySearchQuery(query: string) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/collection?query=${query}&sort_by=popularity.desc&include_adult=false&include_video=false`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        cache: 'no-store',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed fetching searched movies');
  }

  const movies: SearchedMovieResponse = await res.json();
  return movies.results;
}

export default async function SearchPage({ searchParams }: SearchProps) {
  const query = searchParams.q ?? '';
  const movies = await fetchMoviesBySearchQuery(query);

  return (
    <>
      <SectionTitle>Search</SectionTitle>

      <div className="mt-8 grid max-w-screen-lg grid-cols-5 gap-4">
        <Suspense fallback={<MovieCard.Ghost />}>
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={castSearchedMovieToMovie(movie)} />
          ))}
          {movies.length === 0 && <p>No movies was found</p>}
        </Suspense>
      </div>
    </>
  );
}
