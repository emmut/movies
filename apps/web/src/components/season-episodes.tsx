import { Film } from 'lucide-react';

import { EpisodeGrid } from '@/components/episode-grid';
import { Imgproxy } from '@/components/image-proxy';
import { getSeason } from '@/lib/pdp';
import { optional } from '@/lib/tmdb';

export async function SeasonEpisodes({
  tvId,
  seasonNumber,
}: {
  tvId: number;
  seasonNumber: number;
}) {
  const season = await optional(getSeason(tvId, seasonNumber), null);
  if (!season) {
    return <p>Season information is temporarily unavailable. Please try again.</p>;
  }
  const items = season.episodes.map((episode) => ({
    episode,
    artwork: episode.still_path ? (
      <Imgproxy
        src={episode.still_path}
        alt={episode.name}
        width={640}
        height={360}
        className="h-full w-full object-cover"
      />
    ) : (
      <Film className="h-8 w-8 text-zinc-600" aria-label="No episode image available" />
    ),
  }));
  return (
    <div className="space-y-8">
      <header className="space-y-3 rounded-2xl border border-white/10 bg-linear-to-br from-zinc-800/70 to-zinc-900/30 p-6 sm:p-8">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">Season guide</p>
        <h1 className="text-3xl font-bold tracking-tight wrap-anywhere sm:text-4xl">
          {season.name}
        </h1>
        <p className="text-sm text-zinc-400">
          {season.episodes.length} episodes · Browse the season at your own pace.
        </p>
      </header>
      <EpisodeGrid items={items} />
    </div>
  );
}
