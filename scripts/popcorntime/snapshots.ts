import { createWriteStream } from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

import { z } from 'zod';

import { POPCORNTIME_MAX_AGE_DAYS } from '@/lib/popcorntime-contract';

const API_ORIGIN = 'https://api.popcorntime.app';
const MAX_FILE_BYTES = 256 * 1024 * 1024;
const releaseVersion = z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/);
const manifestSchema = z.object({
  latest: releaseVersion,
  published_at: z.iso.datetime({ offset: true }),
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)),
  files: z.array(z.object({ path: z.string(), size_bytes: z.number().int().positive() })),
});
export type SnapshotManifest = z.infer<typeof manifestSchema>;

export function parseManifest(value: unknown, now = new Date()) {
  const manifest = manifestSchema.parse(value);
  const age = now.getTime() - new Date(manifest.published_at).getTime();
  if (age < -86_400_000 || age >= POPCORNTIME_MAX_AGE_DAYS * 86_400_000) {
    throw new Error('Popcorn Time release is stale or dated in the future');
  }
  if (new Set(manifest.files.map((file) => file.path)).size !== manifest.files.length) {
    throw new Error('Popcorn Time manifest contains duplicate paths');
  }
  return manifest;
}

/** Only the documented first-party file endpoint receives the API credential. */
export function validateDownloadUrl(value: string, version: string, path: string) {
  const url = new URL(value);
  if (
    url.origin !== API_ORIGIN ||
    url.username ||
    url.password ||
    url.hash ||
    decodeURIComponent(url.pathname) !== `/v1/snapshots/file/${version}/${path}`
  ) {
    throw new Error('Untrusted Popcorn Time download URL');
  }
  return url;
}

export function createSnapshotClient(apiKey: string) {
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' };

  async function request(path: string) {
    const response = await fetch(`${API_ORIGIN}${path}`, {
      headers,
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Popcorn Time API request failed (${response.status})`);
    return response.json() as Promise<unknown>;
  }

  async function getManifest() {
    return parseManifest(await request('/v1/snapshots'));
  }

  async function download(manifest: SnapshotManifest, path: string, destination: string) {
    const file = manifest.files.find((entry) => entry.path === path);
    if (!file) throw new Error(`Popcorn Time manifest is missing ${path}`);
    if (file.size_bytes > MAX_FILE_BYTES)
      throw new Error(`Popcorn Time ${path} exceeds the download limit`);
    const query = new URLSearchParams({ path, version: manifest.latest });
    const descriptor = z
      .object({
        version: releaseVersion,
        path: z.string(),
        size_bytes: z.number().int().positive(),
        download_url: z.url(),
      })
      .parse(await request(`/v1/snapshots/download?${query}`));
    if (
      descriptor.version !== manifest.latest ||
      descriptor.path !== path ||
      descriptor.size_bytes !== file.size_bytes
    ) {
      throw new Error('Popcorn Time download does not match the selected manifest');
    }
    const url = validateDownloadUrl(descriptor.download_url, manifest.latest, path);
    const signal = AbortSignal.timeout(300_000);
    const response = await fetch(url, { headers, redirect: 'error', signal });
    if (!response.ok || !response.body)
      throw new Error(`Popcorn Time file request failed (${response.status})`);
    let bytes = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        callback(
          bytes > file.size_bytes ? new Error('Popcorn Time file exceeds its manifest size') : null,
          chunk,
        );
      },
    });
    await pipeline(
      Readable.fromWeb(response.body as NodeReadableStream<Uint8Array>),
      limit,
      createWriteStream(destination),
      { signal },
    );
    if (bytes !== file.size_bytes) throw new Error('Popcorn Time file is truncated');
  }

  return { getManifest, download };
}
