import { describe, expect, it, vi } from 'vitest';

import { waitForDatabase } from './db-wait';

describe('waitForDatabase', () => {
  it('resolves with the connect result on the first attempt', async () => {
    const client = { connected: true };
    const tryConnect = vi.fn().mockResolvedValue(client);

    await expect(waitForDatabase(tryConnect)).resolves.toBe(client);
    expect(tryConnect).toHaveBeenCalledTimes(1);
  });

  it('retries until the connection succeeds', async () => {
    const client = { connected: true };
    const tryConnect = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue(client);
    const sleep = vi.fn().mockResolvedValue(undefined);
    const onRetry = vi.fn();

    await expect(
      waitForDatabase(tryConnect, { intervalMs: 2_000, now: () => 0, onRetry, sleep }),
    ).resolves.toBe(client);

    expect(tryConnect).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2_000);
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1);
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2);
  });

  it('rethrows the last error once another attempt would overshoot the deadline', async () => {
    const lastError = new Error('still starting');
    const tryConnect = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValue(lastError);
    const sleep = vi.fn().mockResolvedValue(undefined);
    let clock = 0;
    function now() {
      clock += 1_500;
      return clock;
    }

    await expect(
      waitForDatabase(tryConnect, { timeoutMs: 3_000, intervalMs: 1_000, now, sleep }),
    ).rejects.toBe(lastError);

    expect(tryConnect).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('sleeps for real between attempts when no sleep is injected', async () => {
    const tryConnect = vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValue('ok');

    await expect(waitForDatabase(tryConnect, { intervalMs: 1 })).resolves.toBe('ok');
    expect(tryConnect).toHaveBeenCalledTimes(2);
  });
});
