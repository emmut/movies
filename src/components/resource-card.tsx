import { cn, formatImageUrl } from '@/lib/utils';
import { Movie, MovieDetails } from '@/types/Movie';
import { TvDetails, TvShow } from '@/types/TvShow';
import { Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type ResourceCardProps = {
  resource: Movie | MovieDetails | TvShow | TvDetails;
  type: 'movie' | 'tv';
  className?: string;
};

function isMovie(
  resource: Movie | MovieDetails | TvShow | TvDetails
): resource is Movie | MovieDetails {
  return 'title' in resource;
}

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
    type === 'tv'
      ? 'border-yellow-400/30 hover:border-yellow-300'
      : 'border-red-500/30 hover:border-red-500';

  return (
    <Link
      href={href}
      className={cn(
        'group aspect-2/3 w-full flex-shrink-0 overflow-hidden rounded-lg border bg-zinc-900 transition-all duration-300 hover:scale-105',
        borderColor,
        className
      )}
    >
      <div className="relative h-full">
        {resource.poster_path ? (
          <Image
            className="h-full w-full object-cover"
            src={formatImageUrl(resource.poster_path, 500)}
            alt={`Poster image of ${title}`}
            width={500}
            height={750}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority
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

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="absolute right-0 bottom-0 left-0 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold">{title}</h3>
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span>{releaseYear}</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span>{score}</span>
            </div>
          </div>
        </div>

        <div className="absolute top-2 left-2 opacity-0 transition-opacity group-hover:opacity-100">
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              type === 'movie'
                ? 'bg-red-500/95 text-red-950'
                : 'bg-yellow-500/95 text-yellow-950'
            }`}
          >
            {type === 'movie' ? 'Movie' : 'TV Show'}
          </span>
        </div>
      </div>
    </Link>
  );
}

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
