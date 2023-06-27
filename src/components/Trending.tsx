import { Movie } from '@/types/Movie';
import { formatDateYear, formatImageUrl } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

type MovieProp = {
  movie: Movie;
};

export default async function Tredning({ movie }: MovieProp) {
  return (
    <Link
      href={`/movie/${movie.id}`}
      className="relative grid max-h-64 flex-1 grid-cols-2 grid-rows-6"
    >
      {movie.backdrop_path && (
        <Image
          src={formatImageUrl(movie.backdrop_path, 780)}
          alt={`Poster of ${movie.title}`}
          className="col-span-full row-span-full object-cover"
          sizes="(max-width:1024px) 100vw, 33vw"
          fill
          priority
        />
      )}

      <div className="z-10 col-span-full row-start-5 row-end-7 bg-zinc-950/25 px-3 py-2">
        <h4 className="text-md truncate whitespace-nowrap font-semibold md:text-lg">
          {movie.title}
        </h4>
        {movie.release_date && (
          <p className="text-sm">{formatDateYear(movie.release_date)}</p>
        )}
      </div>
    </Link>
  );
}
