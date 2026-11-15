import { spawnSync } from 'node:child_process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }));

const success = {
  status: 0,
  signal: null,
  error: undefined,
  pid: 1,
  output: [],
  stdout: '',
  stderr: '',
};
const originalExitCode = process.exitCode;

beforeEach(() => {
  vi.resetModules();
  vi.mocked(spawnSync).mockReset().mockReturnValue(success);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe('daily maintenance', () => {
  it('runs all scripts in order with inherited environment and bounded execution', async () => {
    await import('./daily-maintenance');

    expect(vi.mocked(spawnSync).mock.calls.map((call) => call[1])).toEqual([
      ['scripts/sync-titles.ts'],
      ['scripts/ingest-imdb-ratings.ts'],
      ['scripts/ingest-search-index.ts'],
    ]);
    expect(spawnSync).toHaveBeenCalledWith('./node_modules/.bin/vpx', expect.any(Array), {
      stdio: 'inherit',
      timeout: 21_600_000,
      killSignal: 'SIGKILL',
    });
    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenLastCalledWith(
      '[daily-maintenance] Finished: 3 succeeded, 0 failed',
    );
  });

  it.each([
    { status: 1, signal: null, error: undefined, reason: 'exit 1' },
    { status: null, signal: 'SIGTERM' as const, error: undefined, reason: 'SIGTERM' },
    { status: null, signal: null, error: new Error('spawn ENOENT'), reason: 'spawn ENOENT' },
    {
      status: null,
      signal: 'SIGKILL' as const,
      error: new Error('spawn ETIMEDOUT'),
      reason: 'spawn ETIMEDOUT',
    },
  ])(
    'continues after a child failure ($reason) and preserves the failure status',
    async ({ reason, ...result }) => {
      vi.mocked(spawnSync).mockReturnValueOnce({ ...success, ...result });

      await import('./daily-maintenance');

      expect(spawnSync).toHaveBeenCalledTimes(3);
      expect(process.exitCode).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        `[daily-maintenance] title-sync failed: ${reason}`,
      );
      expect(console.log).toHaveBeenLastCalledWith(
        '[daily-maintenance] Finished: 2 succeeded, 1 failed',
      );
    },
  );

  it('reports every failure even when all jobs fail', async () => {
    vi.mocked(spawnSync).mockReturnValue({ ...success, status: 2 });

    await import('./daily-maintenance');

    expect(console.error).toHaveBeenCalledTimes(3);
    expect(process.exitCode).toBe(1);
    expect(console.log).toHaveBeenLastCalledWith(
      '[daily-maintenance] Finished: 0 succeeded, 3 failed',
    );
  });
});
