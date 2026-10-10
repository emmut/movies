import 'server-only';
import { DEFAULT_REGION, getRegionByCode, type RegionCode } from '@movies/config/regions';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { user } from './schema/auth';

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}

/** Stored values outside the supported set predate validation; treat them as the default. */
function toRegionCode(stored: string | null): RegionCode {
  if (!stored) {
    return DEFAULT_REGION;
  }
  const region = getRegionByCode(stored);
  if (!region) {
    return DEFAULT_REGION;
  }
  return region.code;
}

/**
 * Account preference reads and writes shared by every host. Callers own the
 * session check and pass the verified user ID; validation of incoming values
 * happens at each host's interface.
 */
export function createUserPreferenceStore<TSchema extends Record<string, unknown>>(
  db: NodePgDatabase<TSchema>,
) {
  async function readRegion(userId: string): Promise<RegionCode> {
    const rows = await db
      .select({ region: user.region })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (rows.length === 0) {
      throw new UserNotFoundError();
    }
    return toRegionCode(rows[0].region);
  }

  async function writeRegion(userId: string, region: RegionCode): Promise<RegionCode> {
    const updated = await db
      .update(user)
      .set({ region, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({ id: user.id });
    if (updated.length === 0) {
      throw new UserNotFoundError();
    }
    return region;
  }

  return { readRegion, writeRegion };
}

export type UserPreferenceStore = ReturnType<typeof createUserPreferenceStore>;
