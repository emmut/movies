import Badge from '@/components/badge';
import { fetchTrendingMovies } from '@/lib/movies';
import { fetchTrendingTvShows } from '@/lib/tv-shows';
import { formatDateYear, formatImageUrl } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

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
  const resources =
    type === 'movie'
      ? await fetchTrendingMovies()
      : await fetchTrendingTvShows();

  if (resources.length < index - 1) {
    return null;
  }

  const resource = resources[index];

  const title = 'title' in resource ? resource.title : resource.name;
  const releaseDate =
    'release_date' in resource
      ? resource.release_date
      : resource.first_air_date;
  const href =
    type === 'movie' ? `/movie/${resource.id}` : `/tv/${resource.id}`;

  const borderColor =
    type === 'movie' ? 'hover:border-yellow-300' : 'hover:border-red-500';

  return (
    <Link
      href={href}
      className={`group relative h-52 overflow-hidden rounded-xl border ${borderColor} transition-all hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black focus:outline-none lg:h-72 lg:flex-1`}
    >
      {resource.backdrop_path && (
        <Image
          src={formatImageUrl(resource.backdrop_path, 780)}
          alt={`Poster of ${title}`}
          className="col-span-full row-span-full object-cover"
          sizes="(max-width:1024px) 100vw, 33vw"
          quality={85}
          fill
          priority
          fetchPriority="high"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

      <div className="absolute top-3 left-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        <Badge variant={type === 'movie' ? 'yellow' : 'red'}>
          {type === 'movie' ? 'Movie' : 'TV Show'}
        </Badge>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col justify-center bg-zinc-950 px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-md truncate font-semibold whitespace-nowrap md:text-lg">
            {title}
          </h2>
        </div>
        {releaseDate && (
          <p className="text-sm">{formatDateYear(releaseDate)}</p>
        )}
      </div>
    </Link>
  );
}

Trending.Skeleton = function TrendingSkeleton() {
  return (
    <div className="relative h-52 animate-pulse overflow-hidden rounded-xl bg-neutral-50/10 lg:h-72 lg:flex-1">
      <div className="absolute right-0 bottom-0 left-0 z-10 flex h-12 flex-col justify-center bg-zinc-950/10 px-3 py-2"></div>
    </div>
  );
};

export default Trending;
