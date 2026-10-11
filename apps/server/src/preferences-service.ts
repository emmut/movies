import 'server-only';
import type { PreferencesService } from '@movies/api/router';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { createUserPreferenceStore } from '@movies/db/user-preferences';
import type { Database } from '@server/database';
import { readWatchProviders, toProviderChoices } from '@server/watch-provider-options';

async function missingDatabase(): Promise<never> {
  throw new Error('Account preferences require DATABASE_URL');
}

/** Session-scoped preferences backed by the same account rows web reads. */
export function createPreferencesService(
  database: Database | undefined,
  fetchTmdb: TmdbFetch,
): PreferencesService {
  async function providerOptions(input: Parameters<PreferencesService['providerOptions']>[0]) {
    return toProviderChoices(await readWatchProviders(fetchTmdb, 'movie', input.region));
  }
  if (!database) {
    return {
      region: missingDatabase,
      setRegion: missingDatabase,
      providers: missingDatabase,
      setProviders: missingDatabase,
      providerOptions,
    };
  }
  const store = createUserPreferenceStore(database);
  return {
    providerOptions,
    async providers(userId) {
      return { providerIds: await store.readProviders(userId) };
    },
    async setProviders(userId, input) {
      return { providerIds: await store.writeProviders(userId, input.providerIds) };
    },
    async region(userId) {
      return { region: await store.readRegion(userId) };
    },
    async setRegion(userId, input) {
      return { region: await store.writeRegion(userId, input.region) };
    },
  };
}
