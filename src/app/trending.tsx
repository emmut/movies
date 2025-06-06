import { fetchTrendingMovies } from '@/lib/movies';
import { formatDateYear, formatImageUrl } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

type TrendingCardProp = {
  index: number;
};

async function Trending({ index }: TrendingCardProp) {
  const movies = await fetchTrendingMovies();

  if (movies.length < index - 1) {
    return null;
  }

  const movie = movies[index];

  return (
    <Link
      href={`/movie/${movie.id}`}
      className="relative h-52 overflow-hidden rounded-xl lg:h-72 lg:flex-1"
    >
      {movie.backdrop_path && (
        <Image
          src={formatImageUrl(movie.backdrop_path, 780)}
          alt={`Poster of ${movie.title}`}
          className="col-span-full row-span-full object-cover"
          sizes="(max-width:1024px) 100vw, 33vw"
          quality={85}
          fill
          priority
        />
      )}

      <div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col justify-center bg-zinc-950/25 px-3 py-2">
        <h3 className="text-md truncate font-semibold whitespace-nowrap md:text-lg">
          {movie.title}
        </h3>
        {movie.release_date && (
          <p className="text-sm">{formatDateYear(movie.release_date)}</p>
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
