import { cachePublicRead } from '@server/public-cache';
import { afterEach, expect, it, vi } from 'vite-plus/test';

afterEach(() => vi.useRealTimers());
it('coalesces successful reads, expires entries and bounds memory', async () => {
  vi.useFakeTimers();
  const read = vi.fn(async (id: number) => id);
  const cached = cachePublicRead(read, 1000, 2);
  await Promise.all([cached(1), cached(1)]);
  expect(read).toHaveBeenCalledTimes(1);
  await cached(2);
  await cached(3);
  await cached(1);
  expect(read).toHaveBeenCalledTimes(4);
  vi.advanceTimersByTime(1001);
  await cached(1);
  expect(read).toHaveBeenCalledTimes(5);
});
it('never retains failed optional reads', async () => {
  const read = vi
    .fn()
    .mockRejectedValueOnce(new Error('temporary'))
    .mockResolvedValue({ claims: [] });
  const cached = cachePublicRead(read, 86400000);
  await expect(cached()).rejects.toThrow('temporary');
  await expect(cached()).resolves.toEqual({ claims: [] });
  expect(read).toHaveBeenCalledTimes(2);
});
