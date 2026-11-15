import { Skeleton } from '@movies/ui/components/skeleton';

import { BackTargetLink } from '@/components/back-target-link';
import Badge from '@/components/badge';
import { Imgproxy } from '@/components/image-proxy';
import { createServerApi } from '@/lib/api-server';
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
  const resources = await createServerApi(new Headers()).home.trending({ type });

  const resource = resources[index];
  if (!resource) {
    return null;
  }

  const { title, releaseDate, backdropUrl } = resource;
  const href = `/${type}/${resource.id}`;

  const borderColor = type === 'movie' ? 'hover:border-yellow-300' : 'hover:border-red-500';

  return (
    <BackTargetLink
      href={href}
      // `isolate`: the title overlay below stacks above this card's backdrop,
      // which is a card-internal concern. Without a stacking context here that
      // z-index competes with the sticky header's and wins on DOM order, so the
      // title paints through the header as the card scrolls under it.
      className={`group relative isolate h-52 overflow-hidden rounded-xl border ${borderColor} transition-all hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black focus:outline-none lg:h-72 lg:flex-1`}
    >
      {backdropUrl && (
        <Imgproxy
          src={backdropUrl}
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

      <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />

      <div className="absolute top-3 left-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        <Badge variant={type === 'movie' ? 'yellow' : 'red'}>
          {type === 'movie' ? 'Movie' : 'TV Show'}
        </Badge>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col justify-center bg-linear-to-t from-zinc-950/50 to-transparent px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-md truncate font-semibold whitespace-nowrap md:text-lg">{title}</h2>
        </div>
        {releaseDate && <p className="text-sm">{formatDateYear(releaseDate)}</p>}
      </div>
    </BackTargetLink>
  );
}

Trending.Skeleton = function TrendingSkeleton() {
  return (
    <div
      data-slot="home-trending-skeleton"
      className="relative isolate h-52 overflow-hidden rounded-xl border lg:h-72 lg:flex-1"
    >
      <Skeleton className="absolute inset-0 rounded-none" />

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col justify-center px-3 py-2">
        <Skeleton data-slot="trending-title-skeleton" className="h-6 w-2/3" />
        <Skeleton data-slot="trending-year-skeleton" className="mt-1 h-5 w-12" />
      </div>
    </div>
  );
};

export default Trending;
