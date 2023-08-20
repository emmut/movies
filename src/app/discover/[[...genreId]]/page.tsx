import { env } from 'process';
import { Suspense } from 'react';
import SectionTitle from '@/components/SectionTitle';
import Spinner from '@/components/Spinner';
import { fetchAvailableGenres } from '@/lib/discover';
import type { MovieResponse } from '@/types/Movie';
import SkipToElement from '@/components/SkipToElement';
import AvailableGenresNavigation from '@/components/AvailableGenresNavigation';
import Movies from '@/components/Movies';

type DiscoverWithGenreParams = {
  params: {
    genreId?: string;
  };
};

async function fetchDiscoverMovies(genreId: number) {
  let url =
    'https://api.themoviedb.org/3/discover/movie?sort_by=polularity.desc&region=SE&include_adult=false&include_video=false';

  if (genreId !== 0) {
    url += `&with_genres=${genreId}`;
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
    next: {
      revalidate: 60 * 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading discover movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export default async function DiscoverWithGenrePage({
  params,
}: DiscoverWithGenreParams) {
  let genreId: number;

  if (params.genreId) {
    genreId = Number(params.genreId);
  } else {
    genreId = 0;
  }

  const [genres, movies] = await Promise.all([
    fetchAvailableGenres(),
    fetchDiscoverMovies(genreId),
  ]);

  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
        <SkipToElement elementId="movies-container">
          Skip to movies
        </SkipToElement>
      </div>

      <div className="relative mt-2 flex flex-wrap gap-2 pt-3">
        <Suspense
          fallback={
            <Spinner className="flex h-12 items-center justify-center" />
          }
        >
          <AvailableGenresNavigation genres={genres} currentGenreId={genreId} />
        </Suspense>
      </div>

      <div
        id="movies-container"
        className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <Suspense fallback={<Movies.Ghosts />}>
          <Movies movies={movies} />
        </Suspense>
      </div>
    </>
  );
}
