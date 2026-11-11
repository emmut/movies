import { HomeMediaCategory } from '@/lib/home-media';

export type MediaSectionConfig = {
  heading: string;
  caption: string;
  type: 'movie' | 'tv';
  category: HomeMediaCategory;
};

/**
 * The ordered media sections rendered below the trending row on the homepage.
 *
 * Shared between the page and its loading skeleton so both render the same
 * headings in the same order — the loading state never shows a different
 * number of sections than the real page, so nothing shifts once content loads.
 */
export const HOME_SECTIONS: MediaSectionConfig[] = [
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

/**
 * Heading row for a homepage media section. Static markup (no data), so it
 * renders identically in the page and its loading skeleton.
 */
export function MediaSectionHeader({ heading, caption }: { heading: string; caption: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
      <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">{heading}</h2>
      <p className="text-sm text-muted-foreground">{caption}</p>
    </div>
  );
}

/**
 * Heading row for the trending section at the top of the homepage.
 */
export function TrendingHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
      <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">Trending Now</h1>
      <p className="text-sm text-muted-foreground">What everyone&#39;s watching</p>
    </div>
  );
}
