import { displayRating, type MediaCard } from '@movies/api/home';
import { Skeleton } from '@movies/ui/components/skeleton';
import { cn } from 'cn';
import { Star } from 'lucide-react';

import { BackTargetLink } from '@/components/back-target-link';
import ClientImage from '@/components/client-image';
import type { ProxyImageUrls } from '@/types/proxy-image';

import Badge from './badge';
import { QuickAddButton } from './quick-add-button';
import { RemoveFromListButton } from './remove-from-list-button';

type ItemCardProps = {
  resource: MediaCard;
  imageUrls?: ProxyImageUrls;
  className?: string;
  userId?: string;
  showListButton?: boolean;
  listId?: string;
  /** Load the poster eagerly with high priority — for above-the-fold cards (LCP). */
  eagerImage?: boolean;
};

type CardArtworkProps = {
  item: MediaCard;
  eagerImage: boolean;
  imageUrls?: ProxyImageUrls;
};

function CardArtwork({ item, eagerImage, imageUrls }: CardArtworkProps) {
  if (!item.posterUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-800">
        <div className="text-center text-zinc-400">
          <div className="mb-2 text-4xl">{item.type === 'movie' ? '🎬' : '📺'}</div>
          <div className="text-sm font-semibold">No Poster</div>
        </div>
      </div>
    );
  }

  return (
    <ClientImage
      imageUrls={imageUrls}
      fallbackSrc={item.posterUrl}
      alt={item.title}
      className="h-full w-full object-cover"
      eager={eagerImage}
    />
  );
}

function CardOverlay({
  title,
  releaseYear,
  score,
  type,
}: {
  title: string;
  releaseYear: string;
  score: number;
  type: MediaCard['type'];
}) {
  const isMovie = type === 'movie';

  return (
    <>
      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 group-focus/item:opacity-100" />

      <div className="absolute right-0 bottom-0 left-0 p-3 text-white opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 group-focus/item:opacity-100">
        <div className="inset-0 bg-linear-to-t from-zinc-950/50 via-transparent to-transparent opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 group-focus/item:opacity-100" />

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
        <Badge variant={isMovie ? 'yellow' : 'red'}>{isMovie ? 'Movie' : 'TV Show'}</Badge>
      </div>
    </>
  );
}

function CardActions({
  mediaId,
  mediaType,
  userId,
  showListButton,
  listId,
}: {
  mediaId: number;
  mediaType: MediaCard['type'];
  userId?: string;
  showListButton: boolean;
  listId?: string;
}) {
  return (
    <>
      {showListButton && listId === undefined && (
        <div className="absolute top-2 right-2 transition-opacity">
          <QuickAddButton mediaId={mediaId} mediaType={mediaType} userId={userId} />
        </div>
      )}

      {listId !== undefined && (
        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 group-focus/item:opacity-100">
          <RemoveFromListButton listId={listId} mediaId={mediaId} mediaType={mediaType} />
        </div>
      )}
    </>
  );
}

/** A poster link with hover/focus metadata and independently composed list actions. */
export default function ItemCard({
  resource: item,
  imageUrls,
  className,
  userId,
  showListButton = true,
  listId,
  eagerImage = false,
}: ItemCardProps) {
  const { title, type } = item;
  const releaseYear = item.releaseDate.slice(0, 4) || 'N/A';
  const borderColor =
    type === 'movie'
      ? 'hover:border-yellow-300 focus-within:border-yellow-300'
      : 'hover:border-red-500 focus-within:border-red-500';

  return (
    <div
      className={cn(
        'group/item relative aspect-2/3 w-full shrink-0 overflow-hidden rounded-lg border bg-zinc-900 transition-all duration-300 focus-within:scale-105 focus-within:ring-2 focus-within:ring-white/50 focus-within:ring-offset-2 focus-within:ring-offset-black focus-within:outline-none hover:scale-105',
        borderColor,
        className,
      )}
    >
      <BackTargetLink href={`/${type}/${item.id}`}>
        <div className="relative h-full w-full">
          <CardArtwork item={item} eagerImage={eagerImage} imageUrls={imageUrls} />
          <CardOverlay
            title={title}
            releaseYear={releaseYear}
            score={displayRating(item.rating)}
            type={type}
          />
        </div>
      </BackTargetLink>
      <CardActions
        mediaId={item.id}
        mediaType={type}
        userId={userId}
        showListButton={showListButton}
        listId={listId}
      />
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
        'group aspect-2/3 w-[150px] shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900',
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
