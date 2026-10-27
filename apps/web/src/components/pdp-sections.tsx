import { ArrowUpRight, CalendarDays, ChevronDown, Film, Tv } from 'lucide-react';
import Link from 'next/link';

import { BackTargetLink } from '@/components/back-target-link';
import { Imgproxy } from '@/components/image-proxy';
import { ItemSlider } from '@/components/item-slider';
import { getAggregateCredits, getCollection, getSeason } from '@/lib/pdp';
import { optional } from '@/lib/tmdb';
import type { Episode, ProductionCompany, SeasonSummary } from '@/types/pdp';

function PosterArtwork({
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

export function ProductionCompanies({ companies }: { companies: ProductionCompany[] }) {
  if (!companies.length) {
    return null;
  }
  return (
    <section className="border-t border-white/10 pt-8">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">Production Companies</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {companies.map((company) => (
          <div
            key={company.id}
            className="flex min-h-20 items-center gap-4 rounded-xl border border-white/5 bg-zinc-900/50 px-4 py-3"
          >
            {company.logo_path && (
              <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-zinc-100 p-2">
                <Imgproxy src={company.logo_path} alt="" width={70} height={35} />
              </div>
            )}
            <span className="min-w-0 text-sm font-medium wrap-anywhere text-zinc-300">
              {company.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function MovieCollection({
  collectionId,
  currentId,
}: {
  collectionId: number;
  currentId: number;
}) {
  const collection = await optional(getCollection(collectionId), null);
  if (!collection) {
    return null;
  }
  const parts = collection.parts
    .filter((part) => part.id !== currentId)
    .sort((a, b) => (a.release_date || '9999').localeCompare(b.release_date || '9999'));
  if (!parts.length) {
    return null;
  }
  return (
    <section className="border-t border-white/10 pt-8">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">{collection.name}</h2>
      <ItemSlider>
        {parts.map((part) => (
          <BackTargetLink
            key={part.id}
            href={`/movie/${part.id}`}
            className="group w-36 shrink-0 snap-start space-y-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:w-40"
          >
            <PosterArtwork path={part.poster_path} title={part.title} type="movie" />
            <p className="line-clamp-2 text-sm leading-snug font-medium wrap-anywhere text-zinc-200 group-hover:text-white">
              {part.title}
            </p>
            <p className="text-sm wrap-anywhere text-zinc-400">
              {part.release_date?.slice(0, 4) || 'Release date TBA'}
            </p>
          </BackTargetLink>
        ))}
      </ItemSlider>
    </section>
  );
}

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
  return (
    <section className="space-y-5 border-t border-white/10 pt-8">
      <h1 className="text-2xl font-semibold">{season.name}</h1>
      <p className="text-sm wrap-anywhere text-zinc-400">
        Expand an episode to reveal its title, image, and description.
      </p>
      {season.episodes.map((episode) => (
        <details
          key={episode.id}
          className="group rounded-xl border border-white/10 bg-zinc-900/50 p-5 transition-colors open:border-white/20"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span>
              Episode {episode.episode_number}{' '}
              <span className="ml-2 font-normal text-zinc-500">
                {episode.air_date || 'Air date TBA'}
              </span>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
            <h2 className="text-lg font-semibold">{episode.name}</h2>
            {episode.still_path && (
              <Imgproxy
                src={episode.still_path}
                alt={episode.name}
                width={480}
                height={270}
                className="rounded-lg"
              />
            )}
            <p className="text-zinc-300">{episode.overview || 'No description available.'}</p>
            <p className="text-sm wrap-anywhere text-zinc-400">
              {episode.runtime ? `${episode.runtime} min · ` : ''}
              {episode.vote_count > 0
                ? `${episode.vote_average.toFixed(1)}/10 (${episode.vote_count} votes)`
                : 'Not yet rated'}
            </p>
          </div>
        </details>
      ))}
    </section>
  );
}

export async function TvRoleCredits({ tvId }: { tvId: number }) {
  const credits = await optional(getAggregateCredits(tvId), null);
  if (!credits?.cast.length) {
    return null;
  }
  return (
    <details className="group rounded-xl border border-white/10 bg-zinc-900/50 p-5 transition-colors open:border-white/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold [&::-webkit-details-marker]:hidden">
        Cast Roles &amp; Episode Counts{' '}
        <ChevronDown
          className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ul className="mt-5 space-y-4 border-t border-white/10 pt-5">
        {credits.cast.map((person) => (
          <li key={person.id}>
            <BackTargetLink href={`/person/${person.id}`} className="font-medium hover:underline">
              {person.name}
            </BackTargetLink>
            <p className="text-sm wrap-anywhere text-zinc-400">
              {person.roles
                .map(
                  (role) => `${role.character || 'Unknown role'} (${role.episode_count} episodes)`,
                )
                .join(', ')}{' '}
              · {person.total_episode_count} episodes total
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}
