import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import TrendingCard from '@/components/trending';
import MediaList from '@/components/media-list';
import { ItemSlider } from '@movies/ui/components/item-slider';
import { orpc } from '@/utils/orpc';

export const Route = createFileRoute('/')({
  component: HomeComponent,
  loader: async ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(context.orpc.movies.trending.queryOptions()),
      context.queryClient.ensureQueryData(context.orpc.tv.trending.queryOptions()),
      context.queryClient.ensureQueryData(context.orpc.movies.nowPlaying.queryOptions({ input: {} })),
      context.queryClient.ensureQueryData(context.orpc.tv.onTheAir.queryOptions({ input: {} })),
      context.queryClient.ensureQueryData(context.orpc.movies.upcoming.queryOptions({ input: {} })),
      context.queryClient.ensureQueryData(context.orpc.tv.popular.queryOptions({ input: {} })),
      context.queryClient.ensureQueryData(context.orpc.movies.topRated.queryOptions({ input: {} })),
      context.queryClient.ensureQueryData(context.orpc.tv.topRated.queryOptions({ input: {} })),
    ]),
});

function HomeComponent() {
  const trendingMovies = useQuery(orpc.movies.trending.queryOptions());
  const trendingTv = useQuery(orpc.tv.trending.queryOptions());
  const nowPlaying = useQuery(orpc.movies.nowPlaying.queryOptions({ input: {} }));
  const onTheAir = useQuery(orpc.tv.onTheAir.queryOptions({ input: {} }));
  const upcoming = useQuery(orpc.movies.upcoming.queryOptions({ input: {} }));
  const popularTv = useQuery(orpc.tv.popular.queryOptions({ input: {} }));
  const topRatedMovies = useQuery(orpc.movies.topRated.queryOptions({ input: {} }));
  const topRatedTv = useQuery(orpc.tv.topRated.queryOptions({ input: {} }));

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Trending Now</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">What everyone&apos;s watching</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(trendingMovies.data ?? []).slice(0, 8).map((item) => (
              <TrendingCard key={item.id} resource={item} type="movie" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(trendingTv.data ?? []).slice(0, 8).map((item) => (
              <TrendingCard key={item.id} resource={item} type="tv" />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Movies in Theaters</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Now playing</p>
        </div>
        <ItemSlider>
          <MediaList items={nowPlaying.data ?? []} type="movie" />
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">TV Shows on Air</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Currently airing</p>
        </div>
        <ItemSlider>
          <MediaList items={onTheAir.data ?? []} type="tv" />
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Coming Soon</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Upcoming movies</p>
        </div>
        <ItemSlider>
          <MediaList items={upcoming.data ?? []} type="movie" />
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Popular TV Shows</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Trending series</p>
        </div>
        <ItemSlider>
          <MediaList items={popularTv.data ?? []} type="tv" />
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Top Rated Movies</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">All-time favorites</p>
        </div>
        <ItemSlider>
          <MediaList items={topRatedMovies.data ?? []} type="movie" />
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Top Rated TV Shows</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Highest rated series</p>
        </div>
        <ItemSlider>
          <MediaList items={topRatedTv.data ?? []} type="tv" />
        </ItemSlider>
      </section>
    </div>
  );
}
