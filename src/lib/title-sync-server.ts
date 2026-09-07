import 'server-only';
import { after } from 'next/server';

import { db } from '@/lib/db';
import { getMovieDetails, getMovieWatchProviders } from '@/lib/movies';
import { isTitleMediaType, syncTitle, type TitleSource } from '@/lib/title-sync';
import { getTvShowDetails, getTvShowWatchProviders } from '@/lib/tv-shows';

/**
 * The app's cached TMDB fetchers as a title source. A write-through scheduled
 * from a detail page is served from the `use cache` entries that page just
 * filled, so it costs no extra TMDB requests.
 */
export const appTitleSource: TitleSource = {
  movieDetails: getMovieDetails,
  tvDetails: getTvShowDetails,
  movieWatchProviders: getMovieWatchProviders,
  tvWatchProviders: getTvShowWatchProviders,
};

/**
 * Schedules a write-through sync of a title's details and availability once
 * the current response has been sent. Failures are logged, never surfaced:
 * the list write already succeeded, and the nightly job catches up on
 * anything missed. Person rows have no availability and are ignored.
 */
export function scheduleTitleSync(resourceType: string, resourceId: number) {
  if (!isTitleMediaType(resourceType)) {
    return;
  }

  after(async () => {
    try {
      await syncTitle(db, appTitleSource, { mediaType: resourceType, tmdbId: resourceId });
    } catch (error) {
      console.error(`Title sync failed for ${resourceType} ${resourceId}:`, error);
    }
  });
}
