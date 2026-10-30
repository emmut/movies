import { CastSlider } from '@/components/cast-slider';
import { getBilledCastMembers, getSeriesCastMembers } from '@/lib/cast-members';
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
    return <CastSlider cast={getSeriesCastMembers(aggregateCredits.cast)} />;
  }
  const credits = await optional(getTvShowCredits(tvId), { id: tvId, cast: [], crew: [] });

  return <CastSlider cast={getBilledCastMembers(credits.cast)} />;
}
