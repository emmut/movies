import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { execute } = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: { execute },
}));

describe('server startup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    execute.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('does not become ready until the database accepts connections', async () => {
    execute.mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValueOnce(undefined);
    const { register } = await import('./instrumentation');

    const startup = register();
    const onReady = vi.fn();
    void startup.then(onReady);

    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    expect(onReady).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2_000);

    await expect(startup).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledTimes(2);
    expect(onReady).toHaveBeenCalledOnce();
  });
});
