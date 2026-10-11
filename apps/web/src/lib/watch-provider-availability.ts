import 'server-only';
import { ensureTitleAvailability } from '@movies/db/title-availability';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { appTitleSource } from '@/lib/title-sync-server';

/** Bind availability catch-up to web's cached TMDB source. */
export function ensureAvailabilityKnown(scope: SQL | undefined) {
  return ensureTitleAvailability(db, appTitleSource, scope);
}
