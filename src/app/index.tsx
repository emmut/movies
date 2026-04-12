import { createFileRoute } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';

import Badge from '@/components/badge';
import { Imgproxy } from '@/components/image-proxy';
import ItemCard from '@/components/item-card';
import ItemGrid from '@/components/item-grid';
import { ItemSlider } from '@/components/ui/item-slider';
import Trending from '@/app/trending';
import { getUser } from '@/lib/auth-server';
import {
  fetchNowPlayingMovies,
  fetchTopRatedMovies,
  fetchTrendingMovies,
  fetchUpcomingMovies,
  fetchUserNowPlayingMovies,
  fetchUserTopRatedMovies,
  fetchUserUpcomingMovies,
} from '@/lib/movies';
import {
  fetchOnTheAirTvShows,
  fetchPopularTvShows,
  fetchTopRatedTvShows,
  fetchTrendingTvShows,
  fetchUserOnTheAirTvShows,
  fetchUserPopularTvShows,
  fetchUserTopRatedTvShows,
} from '@/lib/tv-shows';
import { formatDateYear } from '@/lib/utils';

export const Route = createFileRoute('/')({
  loader: async () => {
    const user = await getUser();
    const [
      trendingMovies,
      trendingTvShows,
      nowPlayingMovies,
      onTheAirTvShows,
      upcomingMovies,
      popularTvShows,
      topRatedMovies,
      topRatedTvShows,
    ] = await Promise.all([
      fetchTrendingMovies(),
      fetchTrendingTvShows(),
      user ? fetchUserNowPlayingMovies() : fetchNowPlayingMovies(),
      user ? fetchUserOnTheAirTvShows() : fetchOnTheAirTvShows(),
      user ? fetchUserUpcomingMovies() : fetchUpcomingMovies(),
      user ? fetchUserPopularTvShows() : fetchPopularTvShows(),
      user ? fetchUserTopRatedMovies() : fetchTopRatedMovies(),
      user ? fetchUserTopRatedTvShows() : fetchTopRatedTvShows(),
    ]);
    return {
      userId: user?.id,
      trendingMovies,
      trendingTvShows,
      nowPlayingMovies,
      onTheAirTvShows,
      upcomingMovies,
      popularTvShows,
      topRatedMovies,
      topRatedTvShows,
    };
  },
  pendingComponent: HomePending,
  component: Home,
});

function HomePending() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-50/10 lg:h-9 lg:w-56" />
          <div className="hidden h-5 w-32 animate-pulse rounded-md bg-neutral-50/10 sm:block" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Trending.Skeleton />
          <Trending.Skeleton />
        </div>
      </section>
      {[...Array(3)].map((_, i) => (
        <section key={i} className="space-y-4">
          <div className="h-7 w-36 animate-pulse rounded-md bg-neutral-50/10 lg:h-8 lg:w-40" />
          <ItemSlider>
            <ItemGrid.Skeletons />
          </ItemSlider>
        </section>
      ))}
    </div>
  );
}

type TrendingCardProps = {
  resource: {
    id: number;
    backdrop_path?: string | null;
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
  };
  type: 'movie' | 'tv';
};

function TrendingCard({ resource, type }: TrendingCardProps) {
  const title = 'title' in resource && resource.title ? resource.title : (resource as { name?: string }).name ?? '';
  const releaseDate =
    'release_date' in resource ? resource.release_date : (resource as { first_air_date?: string }).first_air_date;
  const href = type === 'movie' ? `/movie/${resource.id}` : `/tv/${resource.id}`;
  const borderColor = type === 'movie' ? 'hover:border-yellow-300' : 'hover:border-red-500';

  return (
    <Link
      to={href}
      className={`group relative h-52 overflow-hidden rounded-xl border ${borderColor} transition-all hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black focus:outline-none lg:h-72 lg:flex-1`}
    >
      {resource.backdrop_path && (
        <Imgproxy
          src={resource.backdrop_path}
          alt={`Poster of ${title}`}
          className="col-span-full row-span-full object-cover"
          sizes="(max-width:1024px) 100vw, 33vw"
          quality={85}
          width={780}
          fill
          priority
          fetchPriority="high"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

      <div className="absolute top-3 left-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        <Badge variant={type === 'movie' ? 'yellow' : 'red'}>
          {type === 'movie' ? 'Movie' : 'TV Show'}
        </Badge>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col justify-center bg-gradient-to-t from-zinc-950/50 to-transparent px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-md truncate font-semibold whitespace-nowrap md:text-lg">{title}</h2>
        </div>
        {releaseDate && <p className="text-sm">{formatDateYear(releaseDate)}</p>}
      </div>
    </Link>
  );
}

function Home() {
  const {
    userId,
    trendingMovies,
    trendingTvShows,
    nowPlayingMovies,
    onTheAirTvShows,
    upcomingMovies,
    popularTvShows,
    topRatedMovies,
    topRatedTvShows,
  } = Route.useLoaderData();

  const trendingMovie = trendingMovies[0];
  const trendingTvShow = trendingTvShows[0];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Trending Now</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            What everyone&#39;s watching
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {trendingMovie && <TrendingCard resource={trendingMovie} type="movie" />}
          {trendingTvShow && <TrendingCard resource={trendingTvShow} type="tv" />}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Movies in Theaters</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Now playing</p>
        </div>
        <ItemSlider>
          {nowPlayingMovies.map((item) => (
            <ItemCard
              key={item.id}
              className="max-w-[150px]"
              resource={item}
              type="movie"
              userId={userId}
            />
          ))}
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">TV Shows on Air</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Currently airing</p>
        </div>
        <ItemSlider>
          {onTheAirTvShows.map((item) => (
            <ItemCard
              key={item.id}
              className="max-w-[150px]"
              resource={item}
              type="tv"
              userId={userId}
            />
          ))}
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Coming Soon</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Upcoming movies</p>
        </div>
        <ItemSlider>
          {upcomingMovies.map((item) => (
            <ItemCard
              key={item.id}
              className="max-w-[150px]"
              resource={item}
              type="movie"
              userId={userId}
            />
          ))}
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Popular TV Shows</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Trending series</p>
        </div>
        <ItemSlider>
          {popularTvShows.map((item) => (
            <ItemCard
              key={item.id}
              className="max-w-[150px]"
              resource={item}
              type="tv"
              userId={userId}
            />
          ))}
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Top Rated Movies</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">All-time favorites</p>
        </div>
        <ItemSlider>
          {topRatedMovies.map((item) => (
            <ItemCard
              key={item.id}
              className="max-w-[150px]"
              resource={item}
              type="movie"
              userId={userId}
            />
          ))}
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">Top Rated TV Shows</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Highest rated series</p>
        </div>
        <ItemSlider>
          {topRatedTvShows.map((item) => (
            <ItemCard
              key={item.id}
              className="max-w-[150px]"
              resource={item}
              type="tv"
              userId={userId}
            />
          ))}
        </ItemSlider>
      </section>
    </div>
  );
}
