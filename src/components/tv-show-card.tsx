import { formatImageUrl } from '@/lib/utils';
import { TvShow } from '@/types/TvShow';
import { Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type TvShowCardProps = {
  tvShow: TvShow;
};

export default function TvShowCard({ tvShow }: TvShowCardProps) {
  const score = Math.ceil(tvShow.vote_average * 10) / 10;
  const releaseYear = tvShow.first_air_date
    ? tvShow.first_air_date.split('-')[0]
    : 'N/A';

  return (
    <Link
      href={`/tv/${tvShow.id}`}
      className="group aspect-2/3 overflow-hidden rounded-lg bg-zinc-900 transition-transform hover:scale-105"
    >
      <div className="relative h-full">
        {tvShow.poster_path ? (
          <Image
            className="h-full w-full object-cover"
            src={formatImageUrl(tvShow.poster_path, 500)}
            alt={`Poster image of ${tvShow.name}`}
            width={500}
            height={750}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-800">
            <div className="text-center text-zinc-400">
              <div className="mb-2 text-4xl">📺</div>
              <div className="text-sm font-semibold">No Poster</div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="absolute right-0 bottom-0 left-0 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold">
            {tvShow.name}
          </h3>
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span>{releaseYear}</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span>{score}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
