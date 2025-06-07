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

  // Border colors matching favicon gradient
  const borderColor =
    type === 'tv'
      ? 'border-yellow-400 hover:border-yellow-300'
      : 'border-red-500 hover:border-red-400';

  return (
    <Link
      href={href}
      className={cn(
        'group aspect-2/3 overflow-hidden rounded-lg border bg-zinc-900 transition-all duration-300 hover:scale-105',
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
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-800">
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
      </div>
    </Link>
  );
}

function ResourceCardSkeleton() {
  return (
    <div className="group aspect-2/3 overflow-hidden rounded-lg bg-zinc-900">
      <div className="relative h-full">
        <div className="h-full w-full animate-pulse bg-neutral-50/10" />

        <div className="absolute right-0 bottom-0 left-0 p-3">
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
