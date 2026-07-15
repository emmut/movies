import { Suspense } from 'react';

import Trending from '@/app/trending';
import ItemGrid from '@/components/item-grid';
import MediaList from '@/components/media-list';
import { ItemSlider } from '@/components/ui/item-slider';

import { HOME_SECTIONS, MediaSectionConfig, MediaSectionHeader, TrendingHeader } from './sections';

function MediaSection({ heading, caption, type, category }: MediaSectionConfig) {
  return (
    <section className="space-y-4">
      <MediaSectionHeader heading={heading} caption={caption} />

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
        <TrendingHeader />

        <div className="grid gap-4 lg:grid-cols-2">
          <Suspense fallback={<Trending.Skeleton />}>
            <Trending index={0} type="movie" />
          </Suspense>

          <Suspense fallback={<Trending.Skeleton />}>
            <Trending index={0} type="tv" />
          </Suspense>
        </div>
      </section>

      {HOME_SECTIONS.map((section) => (
        <MediaSection key={section.heading} {...section} />
      ))}
    </div>
  );
}
