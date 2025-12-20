'use client';

import { Database, Globe } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

type ExternalLinksProps = {
  tmdbId: number;
  imdbId?: string | null;
  homepage?: string | null;
  mediaType?: 'movie' | 'tv' | 'person';
};

/**
 * Renders external links for a media item including IMDb, TMDB, and official website links.
 *
 * @param props - The component props
 * @param props.imdbId - Optional IMDb ID for the media item
 * @param props.tmdbId - TMDB ID for the media item
 * @param props.homepage - Optional homepage URL for the media item
 * @param props.mediaType - Type of media (movie or tv or person), defaults to 'movie'
 * @returns JSX element containing external links
 */
export function ExternalLinks({
  imdbId,
  tmdbId,
  homepage,
  mediaType = 'movie',
}: ExternalLinksProps) {
  const isMobile = useIsMobile();
  const tmdbUrl = `https://www.themoviedb.org/${mediaType}/${tmdbId}`;

  return (
    <div className="flex flex-wrap gap-4">
      {imdbId && (
        <a
          className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 font-semibold text-black transition-colors hover:bg-yellow-700"
          href={`https://imdb.com/${mediaType === 'person' ? 'name' : 'title'}/${imdbId}`}
          rel="noopener noreferrer"
          target={isMobile ? undefined : '_blank'}
        >
          IMDb
        </a>
      )}

      <a
        className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-zinc-600"
        href={tmdbUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Database className="h-4 w-4" />
        TMDB
      </a>

      {homepage && (
        <a
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-zinc-600"
          href={homepage}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Globe className="h-4 w-4" />
          Official Website
        </a>
      )}
    </div>
  );
}
