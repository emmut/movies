import { CastSlider } from '@/components/cast-slider';
import { getTvShowCredits } from '@/lib/tv-shows';
import { optional } from '@/lib/tmdb';

/**
 * Billed cast for a TV show. Fetched independently so a slow or failed
 * `/credits` response streams in (or degrades to nothing) without blocking the
 * rest of the page. Creators come from the show details, not this endpoint.
 */
export async function TvCast({ tvId }: { tvId: number }) {
  const credits = await optional(getTvShowCredits(tvId), { id: tvId, cast: [], crew: [] });

  return <CastSlider cast={credits.cast} />;
}
