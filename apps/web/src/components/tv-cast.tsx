import { CastSlider } from '@/components/cast-slider';
import { getAggregateCredits } from '@/lib/pdp';
import { optional } from '@/lib/tmdb';
import { getTvShowCredits } from '@/lib/tv-shows';

/**
 * Series-wide cast, roles, and episode counts in the shared cast slider.
 * Fall back to billed credits if aggregate credits are unavailable.
 */
export async function TvCast({ tvId }: { tvId: number }) {
  const aggregateCredits = await optional(getAggregateCredits(tvId), null);
  if (aggregateCredits) {
    return (
      <CastSlider
        cast={aggregateCredits.cast.map((person) => ({
          id: person.id,
          name: person.name,
          profile_path: person.profile_path,
          character: [...new Set(person.roles.map((role) => role.character).filter(Boolean))].join(
            ', ',
          ),
          episodeCount: person.total_episode_count,
        }))}
      />
    );
  }
  const credits = await optional(getTvShowCredits(tvId), { id: tvId, cast: [], crew: [] });

  return <CastSlider cast={credits.cast.map((person) => ({ ...person, episodeCount: null }))} />;
}
