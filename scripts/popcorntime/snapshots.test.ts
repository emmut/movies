import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createSnapshotClient, parseManifest, validateDownloadUrl } from './snapshots';

const now = new Date('2026-11-07T12:00:00Z');
const manifest = {
  latest: '2026-W45',
  published_at: '2026-11-07T06:00:00Z',
  countries: ['SE'],
  files: [{ path: 'country=SE/links.parquet', size_bytes: 4 }],
};
const fileUrl = 'https://api.popcorntime.app/v1/snapshots/file/2026-W45/country=SE/links.parquet';
const descriptor = {
  version: manifest.latest,
  path: manifest.files[0].path,
  size_bytes: 4,
  download_url: fileUrl,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Popcorn Time snapshot downloads', () => {
  it('pins a complete release and refuses stale, future, malformed and duplicate manifests', () => {
    expect(parseManifest(manifest, now).latest).toBe(manifest.latest);
    for (const change of [
      { published_at: '2026-03-20T06:00:00Z' },
      { published_at: '2027-01-01T00:00:00Z' },
      { latest: '../escape' },
      { files: [...manifest.files, ...manifest.files] },
    ])
      expect(() => parseManifest({ ...manifest, ...change }, now)).toThrow();
  });

  it.each([
    'https://evil.example/file',
    'https://api.popcorntime.app.evil.example/file',
    'https://user@api.popcorntime.app/v1/snapshots/file/2026-W45/country=SE/links.parquet',
    'http://api.popcorntime.app/v1/snapshots/file/2026-W45/country=SE/links.parquet',
    'https://api.popcorntime.app/v1/snapshots/file/old/country=SE/links.parquet',
  ])('never forwards credentials to an untrusted download: %s', (url) => {
    expect(() => validateDownloadUrl(url, manifest.latest, descriptor.path)).toThrow();
  });

  it('downloads the pinned file with bounded requests and checks its exact size', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(manifest))
      .mockResolvedValueOnce(Response.json(descriptor))
      .mockResolvedValueOnce(new Response('PAR1'));
    vi.stubGlobal('fetch', fetchMock);
    const directory = await mkdtemp(join(tmpdir(), 'snapshot-test-'));
    try {
      const client = createSnapshotClient('test-key');
      const release = await client.getManifest();
      const path = join(directory, 'links.parquet');
      await client.download(release, descriptor.path, path);
      expect(await readFile(path, 'utf8')).toBe('PAR1');
      expect(String(fetchMock.mock.calls[1][0])).toContain('version=2026-W45');
      for (const [, options] of fetchMock.mock.calls) {
        expect(options.headers.Authorization).toBe('Bearer test-key');
        expect(options.redirect).toBe('error');
        expect(options.signal).toBeInstanceOf(AbortSignal);
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.each(['missing', 'mismatch', 'truncated', 'oversized', 'http-error'])(
    'aborts a %s download before any database replacement',
    async (failure) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          Response.json(failure === 'mismatch' ? { ...descriptor, version: 'old' } : descriptor),
        );
      fetchMock.mockResolvedValueOnce(
        failure === 'http-error'
          ? new Response(null, { status: 503 })
          : new Response(failure === 'truncated' ? 'PAR' : 'PAR11'),
      );
      vi.stubGlobal('fetch', fetchMock);
      const directory = await mkdtemp(join(tmpdir(), 'snapshot-test-'));
      try {
        await expect(
          createSnapshotClient('test-key').download(
            manifest,
            failure === 'missing' ? 'missing' : descriptor.path,
            join(directory, 'links.parquet'),
          ),
        ).rejects.toThrow();
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
  );

  it('reports upstream HTTP failures without copying credentials or response bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('sensitive response', { status: 401 })),
    );
    await expect(createSnapshotClient('test-key').getManifest()).rejects.toThrow(
      'API request failed (401)',
    );
  });
});
