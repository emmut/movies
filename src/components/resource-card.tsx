import { cn, formatImageUrl } from '@/lib/utils';
import { Movie, MovieDetails } from '@/types/Movie';
import { TvDetails, TvShow } from '@/types/TvShow';
import { Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Badge from './badge';

type ResourceCardProps = {
  resource: Movie | MovieDetails | TvShow | TvDetails;
  type: 'movie' | 'tv';
  className?: string;
};

/**
 * Determines whether the given resource is a movie type.
 *
 * @param resource - The resource to check.
 * @returns True if the resource is a movie or movie details; otherwise, false.
 */
function isMovie(
  resource: Movie | MovieDetails | TvShow | TvDetails
): resource is Movie | MovieDetails {
  return 'title' in resource;
}

/**
 * Displays a card for a movie or TV show resource with poster, title, release year, and score.
 *
 * The card visually distinguishes between movies and TV shows, linking to the resource's detail page and showing additional information and badges on hover or focus. If no poster image is available, a fallback with an emoji and "No Poster" text is shown.
 */
export default function ResourceCard({
  resource,
  type,
  className,
}: ResourceCardProps) {
  const score = Math.ceil(resource.vote_average * 10) / 10;

  const title = isMovie(resource) ? resource.title : resource.name;
  const releaseDate = isMovie(resource)
    ? resource.release_date
    : resource.first_air_date;
  const releaseYear = releaseDate ? releaseDate.split('-')[0] : 'N/A';
  const href = `/${type}/${resource.id}`;
  const emoji = type === 'movie' ? '🎬' : '📺';

  const borderColor =
    type === 'movie'
      ? 'border-yellow-400/30 hover:border-yellow-300 focus:border-yellow-300'
      : 'border-red-500/30 hover:border-red-500 focus:border-red-500';

  return (
    <Link
      href={href}
      className={cn(
        'group aspect-2/3 w-full flex-shrink-0 overflow-hidden rounded-lg border bg-zinc-900 transition-all duration-300 hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black focus:outline-none',
        borderColor,
        className
      )}
    >
      <div className="relative h-full w-full">
        {resource.poster_path ? (
          <Image
            className="object-cover"
            src={formatImageUrl(resource.poster_path, 500)}
            alt={`Poster image of ${title}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800">
            <div className="text-center text-zinc-400">
              <div className="mb-2 text-4xl">{emoji}</div>
              <div className="text-sm font-semibold">No Poster</div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100" />

        <div className="absolute right-0 bottom-0 left-0 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold">{title}</h3>
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span>{releaseYear}</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span>{score}</span>
            </div>
          </div>
        </div>

        <div className="absolute top-2 left-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
          <Badge variant={type === 'movie' ? 'yellow' : 'red'}>
            {type === 'movie' ? 'Film' : 'Serie'}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

/**
 * Renders a skeleton placeholder for a resource card during loading states.
 *
 * Displays a pulsing card with placeholder blocks that mimic the layout of a movie or TV show card.
 */
function ResourceCardSkeleton({ className }: { className?: string }) {
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

ResourceCard.Skeleton = ResourceCardSkeleton;
