import { Skeleton } from '@movies/ui/components/skeleton';
import { cn } from 'cn';
import { Star } from 'lucide-react';

import { BackTargetLink } from '@/components/back-target-link';
import ClientImage from '@/components/client-image';
import { formatImageUrl } from '@/lib/utils';
import { Movie, MovieDetails } from '@/types/movie';
import type { ProxyImageUrls } from '@/types/proxy-image';
import { TvDetails, TvShow } from '@/types/tv-show';

import Badge from './badge';
import { QuickAddButton } from './quick-add-button';
import { RemoveFromListButton } from './remove-from-list-button';

type ItemCardProps = {
  resource: Movie | MovieDetails | TvShow | TvDetails;
  type: 'movie' | 'tv';
  className?: string;
  userId?: string;
  showListButton?: boolean;
  listId?: string;
  /** Load the poster eagerly with high priority — for above-the-fold cards (LCP). */
  eagerImage?: boolean;
};

/**
 * Determines whether the given resource is a movie or tv show.
 *
 * @param resource - The resource to check.
 * @returns True if the resource is a movie or movie details; otherwise, false.
 */
function isResource(
  resource: Movie | MovieDetails | TvShow | TvDetails,
): resource is Movie | MovieDetails {
  return 'title' in resource;
}

function resolveImageSrc(src: string, size: number) {
  if (src.startsWith('http')) {
    return src;
  }

  return formatImageUrl(src, size);
}

/**
 * Displays a card for a movie or TV show resource with poster, title, release year, and score.
 *
 * The card keeps its title, year, score, and media badge visible on every input device, with a subtle lift on hover and a focus ring for keyboard navigation. If no poster image is available, a fallback with an emoji and "No Poster" text is shown.
 */
export default function ItemCard({
  resource: item,
  type,
  className,
  userId,
  showListButton = true,
  listId,
  eagerImage = false,
}: ItemCardProps) {
  const posterImageUrls = (item as { posterImageUrls?: ProxyImageUrls }).posterImageUrls;
  const score = Math.ceil(item.vote_average * 10) / 10;

  const title = isResource(item) ? item.title : item.name;
  const releaseDate = isResource(item) ? item.release_date : item.first_air_date;
  const releaseYear = releaseDate ? releaseDate.split('-')[0] : 'N/A';
  const href = `/${type}/${item.id}`;
  const emoji = type === 'movie' ? '🎬' : '📺';

  return (
    <div
      className={cn(
        'group/item relative aspect-2/3 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-sm transition-[transform,box-shadow,border-color] duration-200 focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/50 focus-within:ring-offset-2 focus-within:ring-offset-black focus-within:outline-none hover:border-white/30 hover:shadow-xl motion-safe:hover:-translate-y-1',
        className,
      )}
    >
      <BackTargetLink href={href} aria-label={title} className="block h-full">
        <div className="relative h-full w-full">
          {item.poster_path ? (
            <ClientImage
              imageUrls={posterImageUrls}
              fallbackSrc={resolveImageSrc(item.poster_path, 500)}
              alt={title}
              className="h-full w-full object-cover"
              eager={eagerImage}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-800">
              <div className="text-center text-zinc-400">
                <div className="mb-2 text-4xl">{emoji}</div>
                <div className="text-sm font-semibold">No Poster</div>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black via-black/10 to-transparent" />

          <div className="absolute right-0 bottom-0 left-0 p-3 pt-10 text-white">
            <h3 className="mb-1 line-clamp-2 text-sm font-semibold">{title}</h3>
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>{releaseYear}</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span>{score}</span>
              </div>
            </div>
          </div>

          <div className="absolute top-2 left-2">
            <Badge variant={type === 'movie' ? 'yellow' : 'red'}>
              {type === 'movie' ? 'Movie' : 'TV Show'}
            </Badge>
          </div>
        </div>
      </BackTargetLink>

      {showListButton && listId === undefined && (
        <div className="absolute top-2 right-2 transition-opacity">
          <QuickAddButton mediaId={item.id} mediaType={type} userId={userId} />
        </div>
      )}

      {listId !== undefined && (
        <div className="absolute top-2 right-2">
          <RemoveFromListButton listId={listId} mediaId={item.id} mediaType={type} />
        </div>
      )}
    </div>
  );
}

type ItemCardSkeletonProps = {
  className?: string;
};

/**
 * Renders a skeleton placeholder for a resource card during loading states.
 *
 * Displays a pulsing card with placeholder blocks that mimic the layout of a movie or TV show card.
 */
function ItemCardSkeleton({ className }: ItemCardSkeletonProps) {
  return (
    <div
      data-slot="item-card-skeleton"
      className={cn(
        'group aspect-2/3 w-[150px] shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900',
        className,
      )}
    >
      <div className="relative h-full w-full">
        <Skeleton className="absolute inset-0 rounded-none" />

        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />

        <Skeleton className="absolute top-2 right-2 size-8 rounded-lg" />

        <div className="absolute right-0 bottom-0 left-0 p-3">
          <Skeleton data-slot="item-card-title-skeleton" className="mb-2 h-4 w-3/4" />
          <div className="flex items-center justify-between">
            <Skeleton data-slot="item-card-metadata-skeleton" className="h-3 w-12" />
            <div className="flex items-center gap-1">
              <Skeleton className="size-3" />
              <Skeleton className="h-3 w-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ItemCard.Skeleton = ItemCardSkeleton;
