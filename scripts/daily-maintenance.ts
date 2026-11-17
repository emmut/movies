#!/usr/bin/env vpx

import { spawnSync } from 'node:child_process';

// Separate processes isolate each script's process.exit calls and release its
// memory before the next job. Keep the longest job (search ingest) last.
const jobs = [
  ['title-sync', 'scripts/sync-titles.ts'],
  ['imdb-ingest', 'scripts/ingest-imdb-ratings.ts'],
  ['search-index-ingest', 'scripts/ingest-search-index.ts'],
] as const;

let failures = 0;
for (const [name, script] of jobs) {
  console.log(`[daily-maintenance] Starting ${name}`);
  const result = spawnSync('./node_modules/.bin/vpx', [script], {
    stdio: 'inherit',
    // Bound each job so a hung process cannot block future daily runs.
    timeout: 6 * 60 * 60 * 1_000,
    killSignal: 'SIGKILL',
  });
  if (result.status === 0 && !result.error) {
    console.log(`[daily-maintenance] ${name} succeeded`);
  } else {
    failures++;
    console.error(
      `[daily-maintenance] ${name} failed: ${result.error?.message ?? result.signal ?? `exit ${result.status}`}`,
    );
  }
}
console.log(
  `[daily-maintenance] Finished: ${jobs.length - failures} succeeded, ${failures} failed`,
);
process.exitCode = failures > 0 ? 1 : 0;
