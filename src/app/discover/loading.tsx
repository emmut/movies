import SectionTitle from '@/components/section-title';
import { Skeleton } from '@/components/ui/skeleton';
import { ITEMS_PER_PAGE } from '@/lib/config';

// Widths approximating each of the 19 movie/TV genre pills TMDB returns (in
// order: Action, Adventure, Animation, Comedy, Crime, Documentary, Drama,
// Family, Fantasy, History, Horror, Music, Mystery, Romance, Science Fiction,
// TV Movie, Thriller, War, Western), so the toolbar wraps to the same height as
// the real one.
const GENRE_PILL_WIDTHS = [
  'w-16',
  'w-24',
  'w-24',
  'w-20',
  'w-16',
  'w-28',
  'w-16',
  'w-16',
  'w-20',
  'w-20',
  'w-16',
  'w-16',
  'w-20',
  'w-24',
  'w-32',
  'w-24',
  'w-20',
  'w-12',
  'w-24',
];

/**
 * Loading skeleton for the discover page.
 *
 * Mirrors the discover shell — title, genre + media-type toolbar, filter row,
 * and the results grid — so the layout stays put when the real (React Query)
 * content renders in. The static title is rendered for real to avoid a flash.
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
          {GENRE_PILL_WIDTHS.map((width, i) => (
            <Skeleton key={i} className={`h-9 rounded-full ${width}`} />
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

      {/* Results grid */}
      <div className="mt-7 grid grid-cols-2 gap-4 @3xl:grid-cols-4 @8xl:grid-cols-5">
        {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
          <Skeleton key={i} className="aspect-2/3 w-full rounded-lg" />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-9" />
          ))}
        </div>
      </div>
    </div>
  );
}
