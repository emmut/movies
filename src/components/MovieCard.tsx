import { formatDateYear, formatImageUrl } from '@/lib/utils';
import { Movie } from '@/types/Movies';
import Image from 'next/image';

type MovieProp = {
  movie: Movie;
};

export default function MovieCard({ movie }: MovieProp) {
  // TODO: link to single page
  return (
    <a
      href="#"
      className="group relative grid aspect-[2/3] w-[150px] flex-shrink-0 snap-center"
    >
      <Image
        src={formatImageUrl(movie.poster_path, 200)}
        alt={`Poster image of ${movie.title}`}
        width={100}
        height={150}
        className="col-span-full row-span-full h-full w-full"
      />
      <div className="col-span-full row-span-full grid place-items-center bg-zinc-950/50 p-3 opacity-0 transition-opacity duration-200 ease-in group-hover:opacity-100">
        <div>
          <h4 className="text-lg font-semibold leading-snug">{movie.title}</h4>
          <p className="text-sm">{formatDateYear(movie.release_date)}</p>
        </div>
      </div>
    </a>
  );
}
