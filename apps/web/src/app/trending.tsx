import { Skeleton } from '@movies/ui/components/skeleton';
import { ArrowUpRight } from 'lucide-react';

import { BackTargetLink } from '@/components/back-target-link';
import Badge from '@/components/badge';
import { Imgproxy } from '@/components/image-proxy';
import { fetchTrendingMovies } from '@/lib/movies';
import { fetchTrendingTvShows } from '@/lib/tv-shows';
import { formatDateYear } from '@/lib/utils';

type TrendingCardProp = {
  index: number;
  type: 'movie' | 'tv';
};

/**
 * Displays a trending movie or TV show card with image, title, release year, and type badge.
 *
 * Fetches trending resources based on the specified {@link type} and displays the resource at the given {@link index} as a styled card. Returns `null` if the index is out of bounds.
 *
 * @param index - The position of the trending resource to display.
 * @param type - The type of resource to display: `'movie'` or `'tv'`.
 *
 * @returns A React element representing the trending card, or `null` if the index is invalid.
 */
async function Trending({ index, type }: TrendingCardProp) {
  const resources = type === 'movie' ? await fetchTrendingMovies() : await fetchTrendingTvShows();

  const resource = resources[index];

  if (!resource) {
    return null;
  }

  const title = 'title' in resource ? resource.title : resource.name;
  const releaseDate = 'release_date' in resource ? resource.release_date : resource.first_air_date;
  const href = type === 'movie' ? `/movie/${resource.id}` : `/tv/${resource.id}`;

  return (
    <BackTargetLink
      href={href}
      aria-label={`Explore ${title}`}
      // `isolate`: the title overlay below stacks above this card's backdrop,
      // which is a card-internal concern. Without a stacking context here that
      // z-index competes with the sticky header's and wins on DOM order, so the
      // title paints through the header as the card scrolls under it.
      className="group relative isolate h-72 overflow-hidden rounded-2xl border border-white/10 bg-muted shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-white/30 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none lg:h-96 lg:flex-1"
    >
      {resource.backdrop_path && (
        <Imgproxy
          src={resource.backdrop_path}
          alt={`Poster of ${title}`}
          className="col-span-full row-span-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          sizes="(max-width:1024px) 100vw, 33vw"
          quality={85}
          width={780}
          fill
          priority
          fetchPriority="high"
        />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />

      <div className="absolute top-5 left-5">
        <Badge variant={type === 'movie' ? 'yellow' : 'red'}>
          {type === 'movie' ? 'Movie' : 'TV Show'}
        </Badge>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col gap-3 p-5 text-white sm:p-6">
        {releaseDate && (
          <p className="text-sm font-medium text-white/70">{formatDateYear(releaseDate)}</p>
        )}
        <h2 className="line-clamp-2 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <span className="mt-1 flex items-center gap-2 text-sm font-medium">
          Explore title
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </span>
      </div>
    </BackTargetLink>
  );
}

Trending.Skeleton = function TrendingSkeleton() {
  return (
    <div
      data-slot="home-trending-skeleton"
      className="relative isolate h-72 overflow-hidden rounded-2xl border lg:h-96 lg:flex-1"
    >
      <Skeleton className="absolute inset-0 rounded-none" />

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col gap-3 p-5 sm:p-6">
        <Skeleton data-slot="trending-year-skeleton" className="h-5 w-12" />
        <Skeleton data-slot="trending-title-skeleton" className="h-9 w-2/3" />
        <Skeleton className="mt-1 h-5 w-28" />
      </div>
    </div>
  );
};

export default Trending;
