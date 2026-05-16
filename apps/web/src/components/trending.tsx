import Badge from '@movies/ui/components/badge';
import { Link } from '@tanstack/react-router';
import { Movie } from '@movies/api/types/movie';
import { TvShow } from '@movies/api/types/tv-show';
import { formatDateYear } from '@movies/ui/lib/utils';

type TrendingCardProps = {
  resource: Movie | TvShow;
  type: 'movie' | 'tv';
};

function TrendingCard({ resource, type }: TrendingCardProps) {
  const title = 'title' in resource ? resource.title : resource.name;
  const releaseDate = 'release_date' in resource ? resource.release_date : resource.first_air_date;
  const href = type === 'movie' ? `/movie/${resource.id}` : `/tv/${resource.id}`;
  const borderColor = type === 'movie' ? 'hover:border-yellow-300' : 'hover:border-red-500';

  return (
    <Link
      to={href}
      className={`group relative h-52 overflow-hidden rounded-xl border ${borderColor} transition-all hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black focus:outline-none lg:h-72 lg:flex-1`}
    >
      {resource.backdrop_path && (
        <img
          src={`https://image.tmdb.org/t/p/w780${resource.backdrop_path}`}
          alt={`Backdrop of ${title}`}
          className="col-span-full row-span-full h-full w-full object-cover"
          width={780}
          height={439}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

      <div className="absolute top-3 left-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        <Badge variant={type === 'movie' ? 'yellow' : 'red'}>
          {type === 'movie' ? 'Movie' : 'TV Show'}
        </Badge>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col justify-center bg-gradient-to-t from-zinc-950/50 to-transparent px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-md truncate font-semibold whitespace-nowrap md:text-lg">{title}</h2>
        </div>
        {releaseDate && <p className="text-sm">{formatDateYear(releaseDate)}</p>}
      </div>
    </Link>
  );
}

TrendingCard.Skeleton = function TrendingSkeleton() {
  return (
    <div className="relative h-52 animate-pulse overflow-hidden rounded-xl bg-neutral-50/10 lg:h-72 lg:flex-1">
      <div className="absolute right-0 bottom-0 left-0 z-10 flex h-12 flex-col justify-center bg-zinc-950/10 px-3 py-2" />
    </div>
  );
};

export default TrendingCard;
