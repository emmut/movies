import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { checkProductionPlan } from './railway-plan-policy';

function plan(changes: object[] = []) {
  return {
    kind: 'railway.config.plan',
    version: 1,
    cliVersion: '5.74.1',
    environmentId: '946b6efa-46da-4fef-910e-59bbd494ea43',
    sourceTree: 'git-tree',
    configEtag: 'etag',
    changeSetHash: `sha256:${'a'.repeat(64)}`,
    destructive: false,
    changeSet: { version: 1, changes, diagnostics: [] },
  };
}

function deletion(name: string) {
  return {
    kind: 'resource.delete',
    address: `service.${name}`,
    severity: 'destructive',
    previous: { type: 'service', name, source: { type: 'github', repo: 'emmut/movies' } },
  };
}

const create = {
  kind: 'resource.create',
  address: 'service.daily-maintenance',
  severity: 'safe',
  resource: { type: 'service', name: 'daily-maintenance' },
};
const update = {
  kind: 'resource.update',
  address: 'service.movies',
  severity: 'safe',
  field: 'deploy',
};

describe('production Railway plan policy', () => {
  it('accepts no-op and the three-cron migration without trusting the destructive flag', () => {
    expect(checkProductionPlan(plan())).toBe(0);
    expect(
      checkProductionPlan(
        plan([create, ...['imdb-ingest', 'title-sync', 'search-index-ingest'].map(deletion)]),
      ),
    ).toBe(4);
  });

  it('accepts ordinary application configuration and variable updates', () => {
    expect(
      checkProductionPlan(
        plan([
          update,
          {
            kind: 'variable.set',
            address: 'service.api',
            severity: 'safe',
            variable: 'TOKEN',
            after: 'secret',
          },
        ]),
      ),
    ).toBe(2);
  });

  it.each([
    deletion('postgres-db'),
    deletion('movies'),
    deletion('unknown'),
    { ...deletion('imdb-ingest'), address: 'database.imdb-ingest' },
    { ...deletion('imdb-ingest'), previous: { type: 'database', name: 'imdb-ingest' } },
    {
      ...deletion('imdb-ingest'),
      previous: { ...deletion('imdb-ingest').previous, name: 'postgres-db' },
    },
    {
      ...deletion('imdb-ingest'),
      previous: {
        ...deletion('imdb-ingest').previous,
        source: { type: 'image', image: 'postgres:18' },
      },
    },
    {
      ...deletion('imdb-ingest'),
      previous: { ...deletion('imdb-ingest').previous, volumeAttachments: { data: {} } },
    },
    { ...update, address: 'service.postgres-db' },
    { ...update, address: 'volume.postgres-db-volume', field: 'config' },
    { ...update, address: 'bucket.backups' },
    { ...update, severity: 'destructive' },
    { ...update, field: 'volumeAttachments' },
    { ...update, field: 'unknown' },
    { ...update, kind: 'resource.replace' },
    { ...update, severity: 'unknown' },
    { ...update, kind: 'variable.delete' },
    { ...create, resource: { ...create.resource, volumeAttachments: { data: {} } } },
    { ...create, resource: { type: 'database', name: 'daily-maintenance' } },
    { ...create, resource: undefined },
    { ...update, field: undefined },
  ])('rejects unsafe or unknown changes: %j', (change) => {
    expect(() => checkProductionPlan(plan([change]))).toThrow('plan rejected');
  });

  it.each([
    null,
    {},
    { ...plan(), version: 2 },
    { ...plan(), cliVersion: 'future' },
    { ...plan(), environmentId: 'preview' },
    { ...plan(), changeSet: {} },
    { ...plan(), changeSetHash: 'invalid' },
    { ...plan(), claim: true },
    { ...plan(), unexpected: 'operation' },
    { ...plan(), changeSet: { ...plan().changeSet, version: 2 } },
    { ...plan(), changeSet: { ...plan().changeSet, changes: null } },
  ])('fails closed on malformed or unsupported plans: %j', (input) => {
    expect(() => checkProductionPlan(input)).toThrow('unsupported or malformed');
  });

  it('blocks diagnostics with errors without exposing their values', () => {
    const input = {
      ...plan(),
      changeSet: {
        ...plan().changeSet,
        diagnostics: [{ severity: 'error', path: 'secret', message: 'secret-token' }],
      },
    };
    expect(() => checkProductionPlan(input)).toThrow('Railway reported plan errors');
    expect(() => checkProductionPlan(input)).not.toThrow('secret-token');
  });

  it('rejects the whole plan if a permitted deletion accompanies a forbidden one', () => {
    expect(() =>
      checkProductionPlan(plan([deletion('title-sync'), deletion('postgres-db')])),
    ).toThrow();
  });
});

it('CLI exits nonzero for a blocked or unreadable plan and never prints malformed secrets', () => {
  const directory = mkdtempSync(join(tmpdir(), 'railway-policy-'));
  const file = join(directory, 'plan.json');
  function run() {
    return spawnSync('./node_modules/.bin/vpx', ['scripts/check-infra-plan.ts', file], {
      encoding: 'utf8',
      timeout: 10_000,
    });
  }
  try {
    writeFileSync(file, JSON.stringify(plan()));
    const accepted = run();
    expect(accepted.status).toBe(0);
    expect(accepted.stdout).toContain('Approved production infrastructure plan');
    writeFileSync(file, JSON.stringify(plan([deletion('postgres-db')])));
    expect(run().status).toBe(1);
    writeFileSync(file, '{"secret": secret-token}');
    const malformed = run();
    expect(malformed.status).toBe(1);
    expect(malformed.stderr).not.toContain('secret-token');
    rmSync(file);
    expect(run().status).toBe(1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
