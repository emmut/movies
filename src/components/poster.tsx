import { formatImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';

type PosterProps = {
  poster_path: string;
  title: string;
};

function Poster({ poster_path, title }: PosterProps) {
  return (
    <div className="lg:col-span-4">
      {poster_path ? (
        <Image
          className="aspect-2/3 w-full max-w-64 rounded-lg border shadow-2xl sm:mx-0 lg:max-w-full"
          src={formatImageUrl(poster_path, 500)}
          alt={`Poster image of ${title}`}
          width={500}
          height={750}
          priority
        />
      ) : (
        <div className="mx-auto flex aspect-2/3 w-full max-w-md items-center justify-center rounded-lg bg-zinc-800 shadow-2xl">
          <div className="text-center text-zinc-400">
            <div className="mb-4 text-6xl">🎬</div>
            <div className="text-lg font-semibold">No Poster</div>
            <div className="text-sm">Available</div>
          </div>
        </div>
      )}
    </div>
  );
}

Poster.Skeleton = function PosterSkeleton() {
  return (
    <div className="lg:col-span-4">
      <Skeleton className="aspect-2/3 w-full max-w-64 rounded-lg shadow-2xl sm:mx-0 lg:max-w-full" />
    </div>
  );
};

export default Poster;
