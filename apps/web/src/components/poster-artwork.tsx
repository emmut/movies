import { Film, Tv } from 'lucide-react';

import { Imgproxy } from '@/components/image-proxy';

export function PosterArtwork({
  path,
  title,
  type,
}: {
  path: string | null;
  title: string;
  type: 'movie' | 'tv';
}) {
  const Icon = type === 'movie' ? Film : Tv;
  return (
    <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-lg transition-colors group-hover:border-white/30">
      {path ? (
        <Imgproxy
          src={path}
          alt={title}
          width={320}
          height={480}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Icon className="h-10 w-10 text-zinc-600" aria-hidden="true" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
    </div>
  );
}
