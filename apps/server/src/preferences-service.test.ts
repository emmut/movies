import { createUserPreferenceStore } from '@movies/db/user-preferences';
import type { Database } from '@server/database';
import { createPreferencesService } from '@server/preferences-service';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@movies/db/user-preferences', () => ({ createUserPreferenceStore: vi.fn() }));

describe('account preferences service', () => {
  it('fails clearly instead of inventing a region when no database is configured', async () => {
    const service = createPreferencesService(undefined, vi.fn());
    await expect(service.region('user-1')).rejects.toThrow('DATABASE_URL');
    await expect(service.setRegion('user-1', { region: 'US' })).rejects.toThrow('DATABASE_URL');
    await expect(service.providers('user-1')).rejects.toThrow('DATABASE_URL');
    await expect(service.setProviders('user-1', { providerIds: [] })).rejects.toThrow(
      'DATABASE_URL',
    );
  });
  it('reads and writes the verified user through the shared store', async () => {
    const database = {} as Database;
    const store = {
      readRegion: vi.fn().mockResolvedValue('NO'),
      writeRegion: vi.fn().mockResolvedValue('US'),
      readProviders: vi.fn().mockResolvedValue([8]),
      writeProviders: vi.fn().mockResolvedValue([8, 9]),
    };
    vi.mocked(createUserPreferenceStore).mockReturnValue(store);
    const service = createPreferencesService(database, vi.fn());
    expect(createUserPreferenceStore).toHaveBeenCalledWith(database);
    expect(await service.region('user-1')).toEqual({ region: 'NO' });
    expect(store.readRegion).toHaveBeenCalledWith('user-1');
    expect(await service.setRegion('user-1', { region: 'US' })).toEqual({ region: 'US' });
    expect(store.writeRegion).toHaveBeenCalledWith('user-1', 'US');
    expect(await service.providers('user-1')).toEqual({ providerIds: [8] });
    expect(store.readProviders).toHaveBeenCalledWith('user-1');
    expect(await service.setProviders('user-1', { providerIds: [8, 9] })).toEqual({
      providerIds: [8, 9],
    });
    expect(store.writeProviders).toHaveBeenCalledWith('user-1', [8, 9]);
  });
});

it('loads all movie provider choices for Settings in upstream order, including absent logos', async () => {
  const fetcher = vi.fn().mockResolvedValue({
    results: [
      { provider_id: 9, provider_name: 'Second', logo_path: null, display_priority: 100 },
      { provider_id: 8, provider_name: 'Netflix', logo_path: '/logo.png', display_priority: 1 },
    ],
  });
  const service = createPreferencesService(undefined, fetcher);
  expect(await service.providerOptions({ region: 'NO' })).toEqual([
    { id: 9, name: 'Second', logoUrl: null },
    { id: 8, name: 'Netflix', logoUrl: 'https://image.tmdb.org/t/p/w92/logo.png' },
  ]);
  expect(fetcher).toHaveBeenCalledWith('/watch/providers/movie', {
    searchParams: { watch_region: 'NO' },
  });
});
it('rejects malformed provider choices and exposes upstream failures for retry', async () => {
  const fetcher = vi.fn().mockResolvedValue({ results: [{ provider_id: -1 }] });
  const service = createPreferencesService(undefined, fetcher);
  await expect(service.providerOptions({ region: 'SE' })).rejects.toThrow();
  fetcher.mockRejectedValue(new Error('offline'));
  await expect(service.providerOptions({ region: 'SE' })).rejects.toThrow('offline');
});
