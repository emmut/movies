import { popcorntimeLinks, popcorntimeSnapshots } from '@movies/db/schema/popcorntime';
import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type { ImportedLink } from './rows';

type Release = { version: string; publishedAt: Date };

/** Readers see either the previous complete country import or the new one. */
export async function replaceCountryLinks(
  db: NodePgDatabase,
  region: string,
  release: Release,
  links: ImportedLink[],
) {
  if (links.length === 0 || links.some((link) => link.region !== region))
    throw new Error('Invalid country import');
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('popcorntime-import'))`);
    const [current] = await tx
      .select()
      .from(popcorntimeSnapshots)
      .where(eq(popcorntimeSnapshots.region, region));
    if (current && current.publishedAt > release.publishedAt)
      throw new Error('Refusing to replace a newer Popcorn Time release');
    await tx.delete(popcorntimeSnapshots).where(eq(popcorntimeSnapshots.region, region));
    await tx.insert(popcorntimeSnapshots).values({ region, ...release });
    for (let start = 0; start < links.length; start += 1000) {
      await tx.insert(popcorntimeLinks).values(links.slice(start, start + 1000));
    }
  });
}
