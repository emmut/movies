import { join } from 'node:path';

import { popcorntimeSnapshots } from '@movies/db/schema/popcorntime';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { readParquetBatches, readParquetRows } from './parquet';
import { mapProviders } from './providers';
import { collectLinks, mapMedia } from './rows';
import type { createSnapshotClient, SnapshotManifest } from './snapshots';
import { replaceCountryLinks } from './store';

const LINK_COLUMNS = [
  'media_id',
  'provider_id',
  'addon_provider_id',
  'season_number',
  'episode_number',
  'link_token',
  'price_types',
  'available_from',
  'available_to',
];
type SnapshotClient = Pick<ReturnType<typeof createSnapshotClient>, 'download'>;

async function pendingRegions(
  db: NodePgDatabase,
  manifest: SnapshotManifest,
  supportedRegions: readonly string[],
) {
  const regions = supportedRegions.filter((region) => manifest.countries.includes(region));
  if (regions.length === 0) throw new Error('Popcorn Time release has no supported countries');
  const current = new Map(
    (await db.select().from(popcorntimeSnapshots)).map((row) => [row.region, row]),
  );
  return regions.filter((region) => {
    const previous = current.get(region);
    return (
      !previous ||
      previous.publishedAt < new Date(manifest.published_at) ||
      previous.version !== manifest.latest
    );
  });
}

async function loadMetadata(client: SnapshotClient, manifest: SnapshotManifest, directory: string) {
  const mediaPath = join(directory, 'media.parquet');
  const providersPath = join(directory, 'providers.parquet');
  await client.download(manifest, 'metadata/core/media_details.parquet', mediaPath);
  await client.download(manifest, 'metadata/core/providers.parquet', providersPath);
  const media = mapMedia(await readParquetRows(mediaPath, ['id', 'tmdb_id', 'content_type']));
  if (media.size === 0) throw new Error('Popcorn Time release has no TMDB identities');
  const providers = await readParquetRows(providersPath, ['id', 'name', 'parent_id', 'country']);
  return { media, providers };
}

/** A completed country is never downloaded twice for the same release. */
export async function importSnapshot(
  db: NodePgDatabase,
  client: SnapshotClient,
  manifest: SnapshotManifest,
  directory: string,
  supportedRegions: readonly string[],
) {
  const regions = await pendingRegions(db, manifest, supportedRegions);
  if (regions.length === 0) {
    console.log(`Popcorn Time ${manifest.latest} is already imported.`);
    return;
  }
  const { media, providers } = await loadMetadata(client, manifest, directory);
  const failures: string[] = [];
  for (const region of regions) {
    try {
      const path = join(directory, 'links.parquet');
      await client.download(manifest, `country=${region}/links.parquet`, path);
      const result = await collectLinks(readParquetBatches(path, LINK_COLUMNS), {
        region,
        media,
        providers: mapProviders(providers, region),
      });
      await replaceCountryLinks(
        db,
        region,
        { version: manifest.latest, publishedAt: new Date(manifest.published_at) },
        result.links,
      );
      console.log(
        `${region}: imported ${result.links.length} links from ${result.total} rows; rejected ${result.ambiguous} ambiguous offers (${manifest.latest}).`,
      );
    } catch {
      // Driver errors can include SQL parameters (tokens). Log context only.
      console.error(`${region}: Popcorn Time import failed; previous complete import retained.`);
      failures.push(region);
    }
  }
  if (failures.length > 0) throw new Error(`Popcorn Time import failed for ${failures.join(', ')}`);
}
