import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import { formatDateYear, formatImageUrl } from '@/lib/utils';
import type { Movie } from '@/types/Movie';

type MovieProp = {
  movie: Movie;
};

function MovieCard({ movie }: MovieProp) {
  const { id, title, release_date, poster_path } = movie;

  return (
    <Link
      href={`/movie/${id}`}
      className="group/movie-card relative grid aspect-2/3 w-full flex-[150px] shrink-0 snap-center overflow-hidden rounded-md"
    >
      {poster_path !== null && (
        <Image
          className="col-span-full row-span-full h-full w-full"
          src={formatImageUrl(poster_path, 200)}
          alt={`Poster image of ${title}`}
          width={300}
          height={450}
          quality={85}
        />
      )}

      <div
        className={clsx([
          'border-muted-foreground col-span-full row-span-full grid place-items-center rounded-md bg-zinc-950/80 p-3 text-center opacity-0 transition-opacity duration-200 ease-in group-hover/movie-card:border group-focus/movie-card:border',
          {
            'group-hover/movie-card:opacity-100 group-focus/movie-card:opacity-100':
              poster_path !== null,
            'opacity-100': poster_path === null,
          },
        ])}
      >
        <div>
          <h3 className="text-lg leading-snug font-semibold">{title}</h3>
          {release_date && (
            <p className="text-muted-foreground/80 text-sm">
              {formatDateYear(release_date)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

MovieCard.Ghost = function Ghost() {
  return (
    <div className="relative grid aspect-2/3 w-full flex-[150px] shrink-0 animate-pulse overflow-hidden rounded-md">
      <div className="border-muted-foreground/25 bg-muted-foreground/10 rounded-md border p-3 transition-opacity duration-200 ease-in"></div>
    </div>
  );
};

export default MovieCard;
