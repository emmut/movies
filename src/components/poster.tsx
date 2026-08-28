import { Imgproxy } from '@/components/image-proxy';

import { Skeleton } from './ui/skeleton';

type PosterProps = {
  poster_path: string;
  title: string;
};

/* Grid items stretch to the full row height, which makes `sticky` a no-op —
   `self-start` keeps the poster its natural height so it can follow the
   scroll. The top offset clears the sticky app header plus the grid gap. */
export const stickyPosterClasses =
  'lg:col-span-4 lg:sticky lg:top-[calc(var(--header-height)+(--spacing(8)))] lg:self-start';

function Poster({ poster_path, title }: PosterProps) {
  return (
    <div className={stickyPosterClasses}>
      {poster_path ? (
        <div className="max-w-64 lg:max-w-full">
          <Imgproxy
            className="aspect-2/3 w-full rounded-lg border shadow-2xl"
            src={poster_path}
            alt={`Poster image of ${title}`}
            width={500}
            height={750}
            priority
          />
        </div>
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
    <div className={stickyPosterClasses}>
      <Skeleton className="aspect-2/3 w-full max-w-64 rounded-lg shadow-2xl sm:mx-0 lg:max-w-full" />
    </div>
  );
};

export default Poster;
