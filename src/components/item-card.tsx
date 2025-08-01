import { cn, formatImageUrl } from '@/lib/utils';
import { Movie, MovieDetails } from '@/types/movie';
import { TvDetails, TvShow } from '@/types/tv-show';
import { Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Badge from './badge';
import { ListButton } from './list-button';
import { RemoveFromListButton } from './remove-from-list-button';

type ItemCardProps = {
  resource: Movie | MovieDetails | TvShow | TvDetails;
  type: 'movie' | 'tv';
  className?: string;
  userId?: string;
  showListButton?: boolean;
  listId?: string;
};

/**
 * Determines whether the given resource is a movie or tv show.
 *
 * @param resource - The resource to check.
 * @returns True if the resource is a movie or movie details; otherwise, false.
 */
function isResource(
  resource: Movie | MovieDetails | TvShow | TvDetails
): resource is Movie | MovieDetails {
  return 'title' in resource;
}

/**
 * Displays a card for a movie or TV show resource with poster, title, release year, and score.
 *
 * The card visually distinguishes between movies and TV shows, linking to the resource's detail page and showing additional information and badges on hover or focus. If no poster image is available, a fallback with an emoji and "No Poster" text is shown.
 */
export default function ItemCard({
  resource: item,
  type,
  className,
  userId,
  showListButton = true,
  listId,
}: ItemCardProps) {
  const score = Math.ceil(item.vote_average * 10) / 10;

  const title = isResource(item) ? item.title : item.name;
  const releaseDate = isResource(item)
    ? item.release_date
    : item.first_air_date;
  const releaseYear = releaseDate ? releaseDate.split('-')[0] : 'N/A';
  const href = `/${type}/${item.id}`;
  const emoji = type === 'movie' ? '🎬' : '📺';

  const borderColor =
    type === 'movie'
      ? 'hover:border-yellow-300 focus-within:border-yellow-300'
      : 'hover:border-red-500 focus-within:border-red-500';

  return (
    <div
      className={cn(
        'group/item relative aspect-2/3 w-full flex-shrink-0 overflow-hidden rounded-lg border bg-zinc-900 transition-all duration-300 focus-within:scale-105 focus-within:ring-2 focus-within:ring-white/50 focus-within:ring-offset-2 focus-within:ring-offset-black focus-within:outline-none hover:scale-105',
        borderColor,
        className
      )}
    >
      <Link href={href}>
        <div className="relative h-full w-full">
          {item.poster_path ? (
            <Image
              className="object-cover"
              src={formatImageUrl(item.poster_path, 500)}
              alt={`Poster image of ${title}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-800">
              <div className="text-center text-zinc-400">
                <div className="mb-2 text-4xl">{emoji}</div>
                <div className="text-sm font-semibold">No Poster</div>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 group-focus/item:opacity-100" />

          <div className="absolute right-0 bottom-0 left-0 p-3 text-white opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 group-focus/item:opacity-100">
            <div className="inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 group-focus/item:opacity-100" />

            <h3 className="mb-1 line-clamp-2 text-sm font-semibold">{title}</h3>
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>{releaseYear}</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span>{score}</span>
              </div>
            </div>
          </div>

          <div className="absolute top-2 left-2 opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 group-focus/item:opacity-100">
            <Badge variant={type === 'movie' ? 'yellow' : 'red'}>
              {type === 'movie' ? 'Movie' : 'TV Show'}
            </Badge>
          </div>
        </div>
      </Link>

      {showListButton && (
        <div className="absolute top-2 right-2 transition-opacity">
          <ListButton mediaId={item.id} mediaType={type} userId={userId} />
        </div>
      )}

      {listId !== undefined && (
        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 group-focus/item:opacity-100">
          <RemoveFromListButton
            listId={listId}
            mediaId={item.id}
            mediaType={type}
          />
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
      className={cn(
        'group aspect-2/3 w-[150px] flex-shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900',
        className
      )}
    >
      <div className="relative h-full">
        <div className="h-full w-full animate-pulse bg-neutral-50/10" />

        <div className="absolute right-0 bottom-0 left-0 p-3 opacity-0">
          <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-neutral-50/10" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-12 animate-pulse rounded bg-neutral-50/10" />
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 animate-pulse rounded bg-neutral-50/10" />
              <div className="h-3 w-6 animate-pulse rounded bg-neutral-50/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ItemCard.Skeleton = ItemCardSkeleton;
