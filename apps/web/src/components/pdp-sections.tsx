import Link from 'next/link';

import { BackTargetLink } from '@/components/back-target-link';
import { Imgproxy } from '@/components/image-proxy';
import { getAggregateCredits, getCollection, getSeason } from '@/lib/pdp';
import { optional } from '@/lib/tmdb';
import type { Episode, ProductionCompany, SeasonSummary } from '@/types/pdp';

export function ProductionCompanies({ companies = [] }: { companies?: ProductionCompany[] }) {
  if (!companies.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Production Companies</h2>
      <div className="flex flex-wrap gap-3">
        {companies.map((company) => (
          <div key={company.id} className="flex items-center gap-3 rounded-lg bg-zinc-900 p-3">
            {company.logo_path && (
              <div className="rounded bg-white p-2">
                <Imgproxy src={company.logo_path} alt="" width={70} height={35} />
              </div>
            )}
            <span>{company.name}</span>
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
  if (!collection) return null;
  const parts = collection.parts
    .filter((part) => part.id !== currentId)
    .sort((a, b) => (a.release_date || '9999').localeCompare(b.release_date || '9999'));
  if (!parts.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">{collection.name}</h2>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {parts.map((part) => (
          <BackTargetLink
            key={part.id}
            href={`/movie/${part.id}`}
            className="w-36 shrink-0 space-y-2"
          >
            {part.poster_path && (
              <Imgproxy
                src={part.poster_path}
                alt={part.title}
                width={144}
                height={216}
                className="rounded-lg"
              />
            )}
            <p className="font-medium">{part.title}</p>
            <p className="text-sm text-zinc-400">
              {part.release_date?.slice(0, 4) || 'Release date TBA'}
            </p>
          </BackTargetLink>
        ))}
      </div>
    </section>
  );
}

function EpisodeSummary({
  label,
  episode,
  tvId,
}: {
  label: string;
  episode?: Episode | null;
  tvId: number;
}) {
  if (!episode) return null;
  return (
    <Link
      href={`/tv/${tvId}/season/${episode.season_number}`}
      className="block rounded-lg bg-zinc-900 p-4"
    >
      <h3 className="font-semibold">{label}</h3>
      <p className="text-zinc-300">
        Season {episode.season_number}, episode {episode.episode_number}
      </p>
      <p className="text-sm text-zinc-400">{episode.air_date || 'Air date TBA'}</p>
    </Link>
  );
}

export function TvSeasons({
  tvId,
  seasons = [],
  next,
  latest,
}: {
  tvId: number;
  seasons?: SeasonSummary[];
  next?: Episode | null;
  latest?: Episode | null;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Seasons &amp; Episodes</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <EpisodeSummary label="Next Episode" episode={next} tvId={tvId} />
        <EpisodeSummary label="Latest Episode" episode={latest} tvId={tvId} />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {seasons.map((season) => (
          <Link
            key={season.id}
            href={`/tv/${tvId}/season/${season.season_number}`}
            className="w-36 shrink-0 space-y-2"
          >
            {season.poster_path && (
              <Imgproxy
                src={season.poster_path}
                alt={season.name}
                width={144}
                height={216}
                className="rounded-lg"
              />
            )}
            <p className="font-medium">{season.name}</p>
            <p className="text-sm text-zinc-400">
              {season.episode_count} episodes · {season.air_date?.slice(0, 4) || 'TBA'}
            </p>
          </Link>
        ))}
      </div>
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
  if (!season) return <p>Season information is temporarily unavailable. Please try again.</p>;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{season.name}</h1>
      <p className="text-sm text-zinc-400">
        Expand an episode to reveal its title, image, and description.
      </p>
      {season.episodes.map((episode) => (
        <details key={episode.id} className="rounded-lg bg-zinc-900 p-4">
          <summary className="cursor-pointer">
            Episode {episode.episode_number} · {episode.air_date || 'Air date TBA'}
          </summary>
          <div className="mt-4 space-y-3">
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
            <p className="text-sm text-zinc-400">
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
  if (!credits?.cast.length) return null;
  return (
    <details className="rounded-lg bg-zinc-900 p-4">
      <summary className="cursor-pointer text-xl font-semibold">
        Cast Roles &amp; Episode Counts
      </summary>
      <ul className="mt-4 space-y-3">
        {credits.cast.map((person) => (
          <li key={person.id}>
            <BackTargetLink href={`/person/${person.id}`} className="font-medium hover:underline">
              {person.name}
            </BackTargetLink>
            <p className="text-sm text-zinc-400">
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
