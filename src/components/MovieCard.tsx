import { formatDateYear, formatImageUrl } from '@/lib/utils';
import { Movie } from '@/types/Movie';
import cn from 'classnames';
import Image from 'next/image';
import Link from 'next/link';

type MovieProp = {
  movie: Movie;
};

function MovieCard({ movie }: MovieProp) {
  const { id, title, release_date, poster_path } = movie;

  return (
    <Link
      href={`/movie/${id}`}
      className="group relative grid aspect-[2/3] w-full flex-[150px] flex-shrink-0 snap-center overflow-hidden rounded-md"
    >
      {poster_path !== null && (
        <Image
          className="col-span-full row-span-full h-full w-full"
          src={formatImageUrl(poster_path, 200)}
          alt={`Poster image of ${title}`}
          width={300}
          height={500}
        />
      )}

      <div
        className={cn([
          'col-span-full row-span-full grid place-items-center rounded-md border-white bg-zinc-950/80 p-3 text-center opacity-0 transition-opacity duration-200 ease-in group-hover:border',
          {
            'group-hover:opacity-100': poster_path !== null,
            'opacity-100': poster_path === null,
          },
        ])}
      >
        <div>
          <h4 className="text-lg font-semibold leading-snug">{title}</h4>
          {release_date && (
            <p className="text-sm">{formatDateYear(release_date)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

MovieCard.Ghost = function Ghost() {
  return (
    <div className="group relative grid aspect-[2/3] w-full flex-[150px] flex-shrink-0 animate-pulse snap-center overflow-hidden rounded-md">
      <div className="col-span-full row-span-full grid place-items-center rounded-md border border-white/25 bg-neutral-50/10 p-3 text-center transition-opacity duration-200 ease-in"></div>
    </div>
  );
};

export default MovieCard;
