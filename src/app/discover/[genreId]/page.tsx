import { Suspense } from 'react';
import Link from 'next/link';
import { Movie } from '@/types/Movie';
import SectionTitle from '@/components/SectionTitle';
import Pill from '@/components/Pill';
import MovieCard from '@/components/MovieCard';
import { baseUrl } from '@/lib/config';
import { fetchAvailableGenres } from '@/lib/discover';

type DiscoverWithGenreParams = {
  params: {
    genreId: string;
  };
};

async function fetchDiscoverMovies(genre: number) {
  const res = await fetch(`${baseUrl}/api/discover?genre=${genre}`, {
    next: {
      revalidate: 60 * 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading discover movies with genre');
  }

  const movies: Movie[] = await res.json();
  return movies;
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
        <Suspense fallback="Loading...">
          {genres.map((genre) => (
            <Link key={genre.id} href={`/discover/${genre.id}`}>
              <Pill active={genre.id === genreId}>{genre.name}</Pill>
            </Link>
          ))}
        </Suspense>
      </div>

      <div className="mt-8 grid max-w-screen-lg grid-cols-5 gap-4">
        <Suspense fallback="Loading...">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </Suspense>
      </div>
    </>
  );
}
