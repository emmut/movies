import { createUserPreferenceStore } from '@movies/db/user-preferences';
import type { Database } from '@server/database';
import { createPreferencesService } from '@server/preferences-service';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@movies/db/user-preferences', () => ({ createUserPreferenceStore: vi.fn() }));

describe('account preferences service', () => {
  it('fails clearly instead of inventing a region when no database is configured', async () => {
    const service = createPreferencesService();
    await expect(service.region('user-1')).rejects.toThrow('DATABASE_URL');
    await expect(service.setRegion('user-1', { region: 'US' })).rejects.toThrow('DATABASE_URL');
  });
  it('reads and writes the verified user through the shared store', async () => {
    const database = {} as Database;
    const store = {
      readRegion: vi.fn().mockResolvedValue('NO'),
      writeRegion: vi.fn().mockResolvedValue('US'),
    };
    vi.mocked(createUserPreferenceStore).mockReturnValue(store);
    const service = createPreferencesService(database);
    expect(createUserPreferenceStore).toHaveBeenCalledWith(database);
    expect(await service.region('user-1')).toEqual({ region: 'NO' });
    expect(store.readRegion).toHaveBeenCalledWith('user-1');
    expect(await service.setRegion('user-1', { region: 'US' })).toEqual({ region: 'US' });
    expect(store.writeRegion).toHaveBeenCalledWith('user-1', 'US');
  });
});
