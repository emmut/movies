import Pill from '@/components/pill';
import SectionTitle from '@/components/section-title';
import { Skeleton } from '@/components/ui/skeleton';
import { ITEMS_PER_PAGE } from '@/lib/config';

// The default (movie) genre set TMDB returns, in order. Rendering the real
// pill labels via the skeleton variant gives the exact same widths and height
// as the loaded toolbar, so the pills don't shift when content arrives.
const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Science Fiction',
  'TV Movie',
  'Thriller',
  'War',
  'Western',
];

/**
 * Loading skeleton for the discover page.
 *
 * Mirrors the discover shell — title, genre + media-type toolbar, filter row,
 * and the results grid — so the layout stays put when the real (React Query)
 * content renders in. The static title and genre pills are rendered for real
 * (pills use the skeleton variant) to avoid a flash or shift.
 */
export default function DiscoverLoading() {
  return (
    <div className="@container w-full">
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
      </div>

      {/* Genre pills + media-type selector */}
      <div className="@container relative mt-4 flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
        <div className="flex flex-1 flex-wrap gap-2 pt-3">
          {MOVIE_GENRES.map((name) => (
            <Pill key={name} variant="skeleton">
              {name}
            </Pill>
          ))}
        </div>
        {/* Media-type selector — a two-segment toggle */}
        <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Sort / runtime / watch-provider filters */}
      <div className="mt-6 flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="min-w-54">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>

      {/* Results grid — capped in height and clipped so the whole skeleton
          stays close to one viewport. A tall skeleton keeps the previous
          route's scroll offset on a client navigation (Next only resets scroll
          once real content arrives), which shows the skeleton "chopped off"; a
          short one lets the browser clamp the scroll back to the top. */}
      <div className="mt-7 grid max-h-[45vh] grid-cols-2 gap-4 overflow-hidden @3xl:grid-cols-4 @8xl:grid-cols-5">
        {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
          <Skeleton key={i} className="aspect-2/3 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
