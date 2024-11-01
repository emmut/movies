import { Suspense } from 'react';
import Movies from '@/components/Movies';
import NowPlayingMovies from './now-playing';
import TopRatedMovies from './top-rated';
import Trending from './trending';

export default async function Home() {
  return (
    <>
      <h2 className="mb-3 mt-5 text-xl font-semibold">Trending</h2>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Suspense fallback={<Trending.Ghost />}>
          <Trending index={0} />
        </Suspense>

        <Suspense fallback={<Trending.Ghost />}>
          <Trending index={1} />
        </Suspense>
      </div>

      <h2 className="mb-3 mt-5 text-xl font-semibold">Now playing</h2>
      <div className="scrollbar-thin flex snap-x space-x-4 overflow-x-auto pb-2">
        <Suspense fallback={<Movies.Ghosts />}>
          <NowPlayingMovies />
        </Suspense>
      </div>
      <h2 className="mb-3 mt-5 text-xl font-semibold">Top Rated</h2>
      <div className="scrollbar-thin flex snap-x space-x-4 overflow-x-auto pb-2">
        <Suspense fallback={<Movies.Ghosts />}>
          <TopRatedMovies />
        </Suspense>
      </div>
    </>
  );
}
