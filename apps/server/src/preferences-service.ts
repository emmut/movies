import 'server-only';
import type { PreferencesService } from '@movies/api/router';
import { createUserPreferenceStore } from '@movies/db/user-preferences';
import type { Database } from '@server/database';

async function missingDatabase(): Promise<never> {
  throw new Error('Account preferences require DATABASE_URL');
}

/** Session-scoped preferences backed by the same account rows web reads. */
export function createPreferencesService(database?: Database): PreferencesService {
  if (!database) {
    return { region: missingDatabase, setRegion: missingDatabase };
  }
  const store = createUserPreferenceStore(database);
  return {
    async region(userId) {
      return { region: await store.readRegion(userId) };
    },
    async setRegion(userId, input) {
      return { region: await store.writeRegion(userId, input.region) };
    },
  };
}
