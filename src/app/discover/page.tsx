import { env } from 'process';
import { Suspense } from 'react';
import SectionTitle from '@/components/SectionTitle';
import MovieCard from '@/components/MovieCard';
import Spinner from '@/components/Spinner';
import SkipToElement from '@/components/SkipToElement';
import AvailableGenresNavigation from '@/components/AvailableGenresNavigation';
import { fetchAvailableGenres } from '@/lib/discover';
import type { MovieResponse } from '@/types/Movie';
import Movies from '@/components/Movies';

async function fetchDiscoverMovies() {
  const res = await fetch(
    'https://api.themoviedb.org/3/discover/movie?sort_by=polularity.desc&region=SE&include_adult=false&include_video=false',
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

export default async function DiscoverPage() {
  const [genres, movies] = await Promise.all([
    fetchAvailableGenres(),
    fetchDiscoverMovies(),
  ]);

  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
        <SkipToElement elementId="movies-container">
          Skip to movies
        </SkipToElement>
      </div>

      <div className="relative mt-2">
        <Suspense fallback={<Spinner />}>
          <AvailableGenresNavigation genres={genres} />
        </Suspense>
      </div>

      <div
        id="movies-container"
        className="mt-8 grid max-w-screen-lg grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <Suspense fallback={<Movies.Ghosts />}>
          <Movies movies={movies} />
        </Suspense>
      </div>
    </>
  );
}
