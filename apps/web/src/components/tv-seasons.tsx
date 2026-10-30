import { ArrowUpRight, CalendarDays } from 'lucide-react';
import Link from 'next/link';

import { ItemSlider } from '@/components/item-slider';
import { PosterArtwork } from '@/components/poster-artwork';
import type { Episode, SeasonSummary } from '@movies/api/tmdb-types/pdp';

function EpisodeSummary({
  label,
  episode,
  tvId,
}: {
  label: string;
  episode: Episode | null;
  tvId: number;
}) {
  if (!episode) {
    return null;
  }
  return (
    <Link
      href={`/tv/${tvId}/season/${episode.season_number}`}
      className="group relative block rounded-xl border border-white/10 bg-linear-to-br from-zinc-800/70 to-zinc-900/50 p-5 transition-colors hover:border-blue-400/40 focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      <h3 className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wider text-zinc-400 uppercase">
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        {label}
      </h3>
      <p className="text-lg font-semibold tracking-tight text-zinc-100">
        Season {episode.season_number}, episode {episode.episode_number}
      </p>
      <p className="mt-1 text-sm text-zinc-400">{episode.air_date || 'Air date TBA'}</p>
      <ArrowUpRight
        className="absolute top-5 right-5 h-4 w-4 text-zinc-500 transition-colors group-hover:text-blue-400"
        aria-hidden="true"
      />
    </Link>
  );
}

export function TvSeasons({
  tvId,
  seasons,
  next,
  latest,
}: {
  tvId: number;
  seasons: SeasonSummary[];
  next: Episode | null;
  latest: Episode | null;
}) {
  return (
    <section className="space-y-5 border-t border-white/10 pt-8">
      <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight">
        Seasons &amp; Episodes{' '}
        <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
          {seasons.length}
        </span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <EpisodeSummary label="Next Episode" episode={next} tvId={tvId} />
        <EpisodeSummary label="Latest Episode" episode={latest} tvId={tvId} />
      </div>
      <ItemSlider>
        {seasons.map((season) => (
          <Link
            key={season.id}
            href={`/tv/${tvId}/season/${season.season_number}`}
            className="group w-36 shrink-0 snap-start space-y-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:w-40"
          >
            <PosterArtwork path={season.poster_path} title={season.name} type="tv" />
            <p className="line-clamp-2 text-sm font-medium wrap-anywhere text-zinc-200 group-hover:text-white">
              {season.name}
            </p>
            <p className="text-sm wrap-anywhere text-zinc-400">
              {season.episode_count} episodes · {season.air_date?.slice(0, 4) || 'TBA'}
            </p>
          </Link>
        ))}
      </ItemSlider>
    </section>
  );
}
