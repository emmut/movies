import { Movie } from '@/types/Movies';
import { formatDateYear, formatImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { IMAGE_CDN_URL } from '@/lib/constants';

type MovieProp = {
  movie: Movie;
};

export default async function Tredning({ movie }: MovieProp) {
  // TODO: link to movie single page
  return (
    <a href="#" className="relative grid flex-1 grid-cols-2 grid-rows-6">
      <Image
        src={formatImageUrl(movie.backdrop_path)}
        alt={`Poster of ${movie.title}`}
        className="col-span-full row-span-full h-full w-full"
        width="750"
        height="380"
      />
      <div className="z-10 col-span-full row-start-6 row-end-7 bg-zinc-950/25 px-3 py-2">
        <h4 className="text-lg font-semibold">{movie.title}</h4>
        <p className="text-sm">{formatDateYear(movie.release_date)}</p>
      </div>
    </a>
  );
}
