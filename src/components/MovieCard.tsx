import { formatDateYear, formatImageUrl } from '@/lib/utils';
import { Movie, SearchedMovie } from '@/types/Movie';
import cn from 'classnames';
import Image from 'next/image';

type MovieProp = {
  movie: Movie;
};

type SearchedMovieProp = {
  movie: SearchedMovie;
};

function MovieCard({ movie }: MovieProp) {
  // TODO: link to single page
  return (
    <a
      href="#"
      className="group relative grid aspect-[2/3] w-full flex-[150px] flex-shrink-0 snap-center"
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
          'col-span-full row-span-full grid place-items-center bg-zinc-950/80 p-3 text-center opacity-0 transition-opacity duration-200 ease-in',
          {
            'group-hover:opacity-100': movie.poster_path !== null,
            'opacity-100': movie.poster_path === null,
          },
        ])}
      >
        <div>
          <h4 className="text-lg font-semibold leading-snug">{movie.title}</h4>
          <p className="text-sm">{formatDateYear(movie.release_date)}</p>
        </div>
      </div>
    </a>
  );
}

MovieCard.Searched = function Searched({ movie }: SearchedMovieProp) {
  // TODO: link to single page
  return (
    <a
      href="#"
      className="group relative grid aspect-[2/3] w-full flex-[150px] flex-shrink-0 snap-center"
    >
      {movie.poster_path !== null && (
        <Image
          className="col-span-full row-span-full aspect-[2/3] h-full w-full max-w-full"
          src={formatImageUrl(movie.poster_path, 200)}
          alt={`Poster image of ${movie.original_name}`}
          width={300}
          height={500}
        />
      )}

      <div
        className={cn([
          'col-span-full row-span-full grid place-items-center bg-zinc-950/80 p-3 text-center opacity-0 transition-opacity duration-200 ease-in',
          {
            'group-hover:opacity-100': movie.poster_path !== null,
            'opacity-100': movie.poster_path === null,
          },
        ])}
      >
        <div>
          <h4 className="text-lg font-semibold leading-snug">
            {movie.original_name}
          </h4>
        </div>
      </div>
    </a>
  );
};

export default MovieCard;
