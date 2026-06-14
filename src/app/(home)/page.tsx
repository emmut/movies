import { Suspense } from 'react';

import Trending from '@/app/trending';
import ItemGrid from '@/components/item-grid';
import MediaList from '@/components/media-list';
import { ItemSlider } from '@/components/ui/item-slider';
import { HomeMediaCategory } from '@/lib/home-media';

type MediaSectionConfig = {
  heading: string;
  caption: string;
  type: 'movie' | 'tv';
  category: HomeMediaCategory;
};

const SECTIONS: MediaSectionConfig[] = [
  {
    heading: 'Movies in Theaters',
    caption: 'Now playing',
    type: 'movie',
    category: 'now-playing-movies',
  },
  {
    heading: 'TV Shows on Air',
    caption: 'Currently airing',
    type: 'tv',
    category: 'on-the-air-tv',
  },
  {
    heading: 'Coming Soon',
    caption: 'Upcoming movies',
    type: 'movie',
    category: 'upcoming-movies',
  },
  {
    heading: 'Popular TV Shows',
    caption: 'Trending series',
    type: 'tv',
    category: 'popular-tv',
  },
  {
    heading: 'Top Rated Movies',
    caption: 'All-time favorites',
    type: 'movie',
    category: 'top-rated-movies',
  },
  {
    heading: 'Top Rated TV Shows',
    caption: 'Highest rated series',
    type: 'tv',
    category: 'top-rated-tv',
  },
];

function MediaSection({ heading, caption, type, category }: MediaSectionConfig) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">{heading}</h2>
        <p className="hidden text-sm text-muted-foreground sm:block">{caption}</p>
      </div>

      <ItemSlider>
        <Suspense fallback={<ItemGrid.Skeletons />}>
          <MediaList category={category} type={type} />
        </Suspense>
      </ItemSlider>
    </section>
  );
}

/**
 * Renders the homepage with categorized sections for trending, popular, and top-rated movies and TV shows.
 *
 * Displays multiple content sections, each featuring a specific category such as trending titles, movies in theaters, currently airing TV shows, upcoming movies, popular TV shows, and top-rated movies and TV shows. Each section loads its content asynchronously and shows skeleton placeholders while loading.
 *
 * @returns The structured homepage layout as a React element.
 */
export default function Home() {
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
          <Suspense fallback={<Trending.Skeleton />}>
            <Trending index={0} type="movie" />
          </Suspense>

          <Suspense fallback={<Trending.Skeleton />}>
            <Trending index={0} type="tv" />
          </Suspense>
        </div>
      </section>

      {SECTIONS.map((section) => (
        <MediaSection key={section.heading} {...section} />
      ))}
    </div>
  );
}
