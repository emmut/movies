#!/usr/bin/env vpx
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getRegionCodes } from '@movies/config/regions';
import { z } from 'zod';

import { connectForCron } from './cron-db';
import { env } from './env';
import { importSnapshot } from './popcorntime/import';
import { createSnapshotClient } from './popcorntime/snapshots';

async function main() {
  if (!env.POPCORNTIME_INGEST_ENABLED) {
    console.log('Popcorn Time import is disabled.');
    return;
  }
  const client = createSnapshotClient(z.string().min(1).parse(env.POPCORNTIME_API_KEY));
  const manifest = await client.getManifest();
  const directory = await mkdtemp(join(tmpdir(), 'popcorntime-'));
  try {
    const db = await connectForCron(env.DATABASE_URL, 1);
    try {
      await importSnapshot(db, client, manifest, directory, getRegionCodes());
    } finally {
      await db.$client.end();
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

main().catch(() => {
  console.error(
    'Popcorn Time import failed. Check the API key, release manifest and country import logs.',
  );
  process.exitCode = 1;
});
