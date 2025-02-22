import { Suspense } from 'react';
import Movies from '@/components/movies';
import NowPlayingMovies from './now-playing';
import TopRatedMovies from './top-rated';
import Trending from './trending';
import { MovieSlider } from '@/components/ui/movie-slider';

export default async function Home() {
  return (
    <>
      <h2 className="mt-5 mb-3 text-xl font-semibold">Trending</h2>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Suspense fallback={<Trending.Ghost />}>
          <Trending index={0} />
        </Suspense>

        <Suspense fallback={<Trending.Ghost />}>
          <Trending index={1} />
        </Suspense>
      </div>

      <h2 className="mt-5 mb-3 text-xl font-semibold">Now playing</h2>
      <MovieSlider>
        <Suspense fallback={<Movies.Ghosts />}>
          <NowPlayingMovies />
        </Suspense>
      </MovieSlider>
      <h2 className="mt-5 mb-3 text-xl font-semibold">Top Rated</h2>
      <MovieSlider>
        <Suspense fallback={<Movies.Ghosts />}>
          <TopRatedMovies />
        </Suspense>
      </MovieSlider>
    </>
  );
}
