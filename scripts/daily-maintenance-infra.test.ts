import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const context = vi.hoisted(() => ({ production: true }));

vi.mock('railway/iac', () => ({
  defineRailway: (configure: (ctx: { isEnvironment: () => boolean }) => unknown) =>
    configure({ isEnvironment: () => context.production }),
  github: (repo: string, options: object) => ({ repo, ...options }),
  image: (name: string) => name,
  preserve: () => 'preserved',
  service: (name: string, config: object) => ({ name, ...config }),
  volume: (name: string) => ({ name }),
  project: (name: string, config: object) => ({ name, ...config }),
  postgres: (name: string) => ({ name, env: { DATABASE_URL: 'bootstrap-db' } }),
}));

afterEach(() => vi.unstubAllEnvs());

describe('daily maintenance infrastructure', () => {
  it.each([true, false])(
    'declares one cron with correct environment flags (production=%s)',
    async (production) => {
      vi.resetModules();
      context.production = production;
      vi.stubEnv('RAILWAY_IAC_BRANCH', 'test-preview');
      vi.stubEnv('RAILWAY_BOOTSTRAP_POSTGRES', 'false');
      // The mock evaluates the definition and exposes the declared resources.
      const { default: config } = await import('../.railway/railway');
      const { resources } = config as unknown as {
        resources: Array<{ name: string; deploy?: { cronSchedule?: string } }>;
      };
      const crons = resources.filter((resource) => resource.deploy?.cronSchedule);

      expect(crons).toEqual([
        expect.objectContaining({
          name: 'daily-maintenance',
          source: production
            ? { repo: 'emmut/movies' }
            : { repo: 'emmut/movies', branch: 'test-preview' },
          deploy: {
            startCommand: './node_modules/.bin/vpx scripts/daily-maintenance.ts',
            cronSchedule: '0 9 * * *',
            restartPolicyType: 'NEVER',
            limitOverride: { containers: { cpu: 1, memoryBytes: 1_000_000_000 } },
          },
          env: {
            DATABASE_URL: 'preserved',
            MOVIE_DB_ACCESS_TOKEN: 'preserved',
            TITLE_SYNC_ENABLED: String(production),
            SEARCH_INDEX_INGEST_ENABLED: String(production),
          },
        }),
      ]);
      expect(resources.map((resource) => resource.name)).toEqual([
        'movies',
        'api',
        'imgproxy-HRto',
        'postgres-db',
        'postgres-db-volume',
        'daily-maintenance',
      ]);
    },
  );
});
