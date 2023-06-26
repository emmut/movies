import { formatDateYear, formatImageUrl } from '@/lib/utils';
import { Movie } from '@/types/Movie';
import cn from 'classnames';
import Image from 'next/image';
import Link from 'next/link';

type MovieProp = {
  movie: Movie;
};

function MovieCard({ movie }: MovieProp) {
  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group relative grid aspect-[2/3] w-full flex-[150px] flex-shrink-0 snap-center overflow-hidden rounded-md"
    >
      {movie.poster_path !== null && (
        <Image
          className="col-span-full row-span-full h-full w-full"
          src={formatImageUrl(movie.poster_path, 200)}
          alt={`Poster image of ${movie.title}`}
          width={300}
          height={500}
        />
      )}

      <div
        className={cn([
          'col-span-full row-span-full grid place-items-center rounded-md border-white bg-zinc-950/80 p-3 text-center opacity-0 transition-opacity duration-200 ease-in group-hover:border',
          {
            'group-hover:opacity-100': movie.poster_path !== null,
            'opacity-100': movie.poster_path === null,
          },
        ])}
      >
        <div>
          <h4 className="text-lg font-semibold leading-snug">{movie.title}</h4>
          {movie.release_date && (
            <p className="text-sm">{formatDateYear(movie.release_date)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
