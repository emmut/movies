import { env } from 'process';
import { Suspense } from 'react';
import Link from 'next/link';
import SectionTitle from '@/components/SectionTitle';
import Pill from '@/components/Pill';
import MovieCard from '@/components/MovieCard';
import { fetchAvailableGenres } from '@/lib/discover';
import { MovieResponse } from '@/types/Movie';
import Spinner from '@/components/Spinner';

type DiscoverWithGenreParams = {
  params: {
    genreId: string;
  };
};

async function fetchDiscoverMovies(genreId: number) {
  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&sort_by=polularity.desc&region=SE&include_adult=false&include_video=false`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      },
      next: {
        revalidate: 60 * 60 * 5,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error loading discover movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export default async function DiscoverWithGenrePage({
  params,
}: DiscoverWithGenreParams) {
  const genreId = parseInt(params.genreId);
  const genres = await fetchAvailableGenres();
  const movies = await fetchDiscoverMovies(genreId);

  return (
    <>
      <SectionTitle>Discover</SectionTitle>

      <div className="mt-2 flex max-w-screen-lg flex-wrap gap-2 pt-3">
        <Suspense fallback={<Spinner />}>
          {genres.map((genre) => (
            <Link key={genre.id} href={`/discover/${genre.id}`}>
              <Pill active={genre.id === genreId}>{genre.name}</Pill>
            </Link>
          ))}
        </Suspense>
      </div>

      <div className="mt-8 grid max-w-screen-lg grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Suspense fallback={<MovieCard.Ghost />}>
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </Suspense>
      </div>
    </>
  );
}
