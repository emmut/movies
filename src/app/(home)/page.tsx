import Trending from '@/app/trending';
import ItemGrid from '@/components/item-grid';
import MediaList from '@/components/media-list';
import { ItemSlider } from '@/components/ui/item-slider';
import {
  fetchNowPlayingMovies,
  fetchTopRatedMovies,
  fetchUpcomingMovies,
  fetchUserNowPlayingMovies,
  fetchUserTopRatedMovies,
  fetchUserUpcomingMovies,
} from '@/lib/movies';
import {
  fetchOnTheAirTvShows,
  fetchPopularTvShows,
  fetchTopRatedTvShows,
  fetchUserOnTheAirTvShows,
  fetchUserPopularTvShows,
  fetchUserTopRatedTvShows,
} from '@/lib/tv-shows';
import { Suspense } from 'react';

/**
 * Renders the homepage with categorized sections for trending, popular, and top-rated movies and TV shows.
 *
 * Displays multiple content sections, each featuring a specific category such as trending titles, movies in theaters, currently airing TV shows, upcoming movies, popular TV shows, and top-rated movies and TV shows. Each section loads its content asynchronously and shows skeleton placeholders while loading.
 *
 * @returns The structured homepage layout as a React element.
 */
export default async function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Trending Now
          </h1>
          <p className="text-muted-foreground hidden text-sm sm:block">
            What everyone&#39;s watching
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Suspense fallback={<Trending.Skeleton />}>
            <Trending index={0} type="movie" />
          </Suspense>

          <Suspense fallback={<Trending.Skeleton />}>
            <Trending index={0} type="tv" />
          </Suspense>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
            Movies in Theaters
          </h2>
          <p className="text-muted-foreground hidden text-sm sm:block">
            Now playing
          </p>
        </div>

        <ItemSlider>
          <Suspense fallback={<ItemGrid.Skeletons />}>
            <MediaList
              fetchUserItems={fetchUserNowPlayingMovies}
              fetchItems={fetchNowPlayingMovies}
              type="movie"
            />
          </Suspense>
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
            TV Shows on Air
          </h2>
          <p className="text-muted-foreground hidden text-sm sm:block">
            Currently airing
          </p>
        </div>

        <ItemSlider>
          <Suspense fallback={<ItemGrid.Skeletons />}>
            <MediaList
              fetchUserItems={fetchUserOnTheAirTvShows}
              fetchItems={fetchOnTheAirTvShows}
              type="tv"
            />
          </Suspense>
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
            Coming Soon
          </h2>
          <p className="text-muted-foreground hidden text-sm sm:block">
            Upcoming movies
          </p>
        </div>

        <ItemSlider>
          <Suspense fallback={<ItemGrid.Skeletons />}>
            <MediaList
              fetchUserItems={fetchUserUpcomingMovies}
              fetchItems={fetchUpcomingMovies}
              type="movie"
            />
          </Suspense>
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
            Popular TV Shows
          </h2>
          <p className="text-muted-foreground hidden text-sm sm:block">
            Trending series
          </p>
        </div>

        <ItemSlider>
          <Suspense fallback={<ItemGrid.Skeletons />}>
            <MediaList
              fetchUserItems={fetchUserPopularTvShows}
              fetchItems={fetchPopularTvShows}
              type="tv"
            />
          </Suspense>
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
            Top Rated Movies
          </h2>
          <p className="text-muted-foreground hidden text-sm sm:block">
            All-time favorites
          </p>
        </div>

        <ItemSlider>
          <Suspense fallback={<ItemGrid.Skeletons />}>
            <MediaList
              fetchUserItems={fetchUserTopRatedMovies}
              fetchItems={fetchTopRatedMovies}
              type="movie"
            />
          </Suspense>
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
            Top Rated TV Shows
          </h2>
          <p className="text-muted-foreground hidden text-sm sm:block">
            Highest rated series
          </p>
        </div>

        <ItemSlider>
          <Suspense fallback={<ItemGrid.Skeletons />}>
            <MediaList
              fetchUserItems={fetchUserTopRatedTvShows}
              fetchItems={fetchTopRatedTvShows}
              type="tv"
            />
          </Suspense>
        </ItemSlider>
      </section>
    </div>
  );
}
