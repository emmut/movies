import Movies from '@/components/movies';
import { MovieSlider } from '@/components/ui/movie-slider';
import Trending from './trending';

export default function Loading() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-50/10 lg:h-9 lg:w-56"></div>
          <div className="hidden h-5 w-32 animate-pulse rounded-md bg-neutral-50/10 sm:block"></div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Trending.Ghost />
          <Trending.Ghost />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-36 animate-pulse rounded-md bg-neutral-50/10 lg:h-8 lg:w-40"></div>
          <div className="hidden h-5 w-28 animate-pulse rounded-md bg-neutral-50/10 sm:block"></div>
        </div>

        <MovieSlider>
          <Movies.Ghosts />
        </MovieSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 animate-pulse rounded-md bg-neutral-50/10 lg:h-8 lg:w-36"></div>
          <div className="hidden h-5 w-32 animate-pulse rounded-md bg-neutral-50/10 sm:block"></div>
        </div>

        <MovieSlider>
          <Movies.Ghosts />
        </MovieSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-28 animate-pulse rounded-md bg-neutral-50/10 lg:h-8 lg:w-32"></div>
          <div className="hidden h-5 w-28 animate-pulse rounded-md bg-neutral-50/10 sm:block"></div>
        </div>

        <MovieSlider>
          <Movies.Ghosts />
        </MovieSlider>
      </section>
    </div>
  );
}
