'use client';

import { buttonVariants } from '@movies/ui/components/button';
import { cn } from 'cn';
import { ArrowUpRight, PlayCircle } from 'lucide-react';

import { MediaViewer, MediaViewerTrigger } from '@/components/media-viewer';
import type { TmdbVideo } from '@movies/api/catalog-support';

function VideoPlayer({ video, title }: { video: TmdbVideo; title: string }) {
  return (
    <div className="flex h-full w-full max-w-7xl flex-col items-center gap-3">
      <iframe
        className="min-h-0 w-full flex-1"
        src={`https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1&rel=0`}
        title={`${title} — ${video.name}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <a
        href={`https://www.youtube.com/watch?v=${video.key}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
      >
        Watch on YouTube <ArrowUpRight className="size-3" aria-hidden="true" />
      </a>
    </div>
  );
}

export function TrailerButton({
  title,
  videos,
  mediaType,
}: {
  title: string;
  videos: TmdbVideo[];
  mediaType: 'movie' | 'tv';
}) {
  const hasTrailer = videos.some((video) => video.type === 'Trailer' || video.type === 'Teaser');
  const label = hasTrailer ? 'Play Trailer' : 'Watch Videos';
  const slides = videos.map((video) => ({
    id: video.id,
    title: `${video.name} · ${video.type}${video.official ? ' · Official' : ''}`,
    content: <VideoPlayer video={video} title={title} />,
  }));

  return (
    <MediaViewer title={`${title} — Videos`} items={slides}>
      <MediaViewerTrigger
        index={0}
        label={`${label}${videos.length > 1 ? ` (${videos.length} videos)` : ''}`}
        className={cn(
          buttonVariants({ size: 'sm' }),
          mediaType === 'movie'
            ? 'bg-yellow-600 hover:bg-yellow-700'
            : 'bg-red-600 text-neutral-50 hover:bg-red-700',
        )}
      >
        <PlayCircle aria-hidden="true" />
        {label}
        {videos.length > 1 && (
          <span className="ml-1 border-l border-white/20 pl-2 text-xs opacity-75">
            {videos.length} videos
          </span>
        )}
      </MediaViewerTrigger>
    </MediaViewer>
  );
}
