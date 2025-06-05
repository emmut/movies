import Movies from '@/components/movies';
import { ItemSlider } from '@/components/ui/item-slider';
import { Suspense } from 'react';
import NowPlayingMovies from './now-playing';
import TopRatedMovies from './top-rated';
import Trending from './trending';
import UpcomingMovies from './upcoming';

export default async function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Trending Now
          </h1>
          <p className="text-muted-foreground hidden text-sm sm:block">
            What everyone's watching
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Suspense fallback={<Trending.Ghost />}>
            <Trending index={0} />
          </Suspense>

          <Suspense fallback={<Trending.Ghost />}>
            <Trending index={1} />
          </Suspense>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
            Now Playing
          </h2>
          <p className="text-muted-foreground hidden text-sm sm:block">
            In theaters now
          </p>
        </div>

        <ItemSlider>
          <Suspense fallback={<Movies.Ghosts />}>
            <NowPlayingMovies />
          </Suspense>
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
            Coming Soon
          </h2>
          <p className="text-muted-foreground hidden text-sm sm:block">
            Upcoming releases
          </p>
        </div>

        <ItemSlider>
          <Suspense fallback={<Movies.Ghosts />}>
            <UpcomingMovies />
          </Suspense>
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
            Top Rated
          </h2>
          <p className="text-muted-foreground hidden text-sm sm:block">
            All-time favorites
          </p>
        </div>

        <ItemSlider>
          <Suspense fallback={<Movies.Ghosts />}>
            <TopRatedMovies />
          </Suspense>
        </ItemSlider>
      </section>
    </div>
  );
}
