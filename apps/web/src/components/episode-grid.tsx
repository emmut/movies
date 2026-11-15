'use client';

import type { Episode } from '@movies/api/tmdb-types/pdp';
import { Button } from '@movies/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader } from '@movies/ui/components/card';
import { Clock, Eye, EyeOff, Film, Star } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type EpisodeItem = { episode: Episode; artwork: ReactNode };

function EpisodeMetadata({ episode }: { episode: Episode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
      {episode.runtime !== null && episode.runtime > 0 && (
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {episode.runtime} min
        </span>
      )}
      <span className="flex items-center gap-1">
        <Star className="h-3.5 w-3.5 text-yellow-500" aria-hidden="true" />
        {episode.vote_count > 0
          ? `${episode.vote_average.toFixed(1)}/10 (${episode.vote_count} votes)`
          : 'Not yet rated'}
      </span>
    </div>
  );
}

function EpisodeCard({
  item,
  revealed,
  onReveal,
}: {
  item: EpisodeItem;
  revealed: boolean;
  onReveal: () => void;
}) {
  const { episode, artwork } = item;
  const contentId = `episode-${episode.id}`;
  return (
    <Card className="min-w-0 gap-0 bg-zinc-900/60 py-0">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-zinc-800/50">
        {revealed ? (
          artwork
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <Film className="h-7 w-7" aria-hidden="true" />
            <span className="text-xs">Episode details hidden</span>
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white tabular-nums">
          E{String(episode.episode_number).padStart(2, '0')}
        </span>
      </div>
      <CardHeader className="gap-2 py-4">
        <p className="text-xs text-zinc-500">{episode.air_date || 'Air date TBA'}</p>
        <h2 className="text-base leading-snug font-semibold wrap-anywhere">
          {revealed ? episode.name : `Episode ${episode.episode_number}`}
        </h2>
        <EpisodeMetadata episode={episode} />
      </CardHeader>
      <CardContent id={contentId} hidden={!revealed} className="pb-4">
        {revealed && (
          <p className="text-sm leading-relaxed wrap-anywhere text-zinc-400">
            {episode.overview || 'No description available.'}
          </p>
        )}
      </CardContent>
      <CardFooter className="mt-auto justify-end border-white/5 bg-transparent">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReveal}
          aria-expanded={revealed}
          aria-controls={contentId}
          aria-label={`${revealed ? 'Hide' : 'Reveal'} episode ${episode.episode_number} details`}
        >
          {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {revealed ? 'Hide details' : 'Reveal episode'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function EpisodeGrid({ items }: { items: EpisodeItem[] }) {
  const [revealedIds, setRevealedIds] = useState<number[]>([]);
  const allRevealed =
    items.length > 0 && items.every(({ episode }) => revealedIds.includes(episode.id));

  function toggleAll() {
    setRevealedIds(allRevealed ? [] : items.map(({ episode }) => episode.id));
  }

  function toggleEpisode(id: number) {
    setRevealedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 p-6 text-sm text-zinc-400">
        No episodes announced yet.
      </p>
    );
  }

  return (
    <section className="space-y-5" aria-label="Episodes">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-semibold">
            Episodes <span className="ml-1 text-sm font-normal text-zinc-500">{items.length}</span>
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Titles, images, and descriptions are hidden to avoid spoilers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleAll}>
          {allRevealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {allRevealed ? 'Hide spoilers' : 'Show spoilers'}
        </Button>
      </div>
      <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <EpisodeCard
            key={item.episode.id}
            item={item}
            revealed={revealedIds.includes(item.episode.id)}
            onReveal={() => toggleEpisode(item.episode.id)}
          />
        ))}
      </div>
    </section>
  );
}
