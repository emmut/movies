import { createRequire } from 'node:module';

import * as railway from 'railway';
import * as iac from 'railway/iac';
import { describe, expect, it } from 'vite-plus/test';

import deployment from '../.railway/railway';

const require = createRequire(import.meta.url);
const entrypoints: [string, typeof iac][] = [
  ['railway (ESM)', railway],
  ['railway/iac (ESM)', iac],
  ['railway (CommonJS)', require('railway')],
  ['railway/iac (CommonJS)', require('railway/iac')],
];

describe('production API provisioning', () => {
  it('adds the shared API without deleting the legacy web variable', async () => {
    const graph = await deployment(
      iac.createRailwayContext({ environmentName: 'production' }),
      iac.project,
    );
    const services = graph.resources?.flat().filter((resource) => resource.type === 'service');
    const web = services?.find((resource) => resource.name === 'movies');
    const api = services?.find((resource) => resource.name === 'api');

    // Deleting this existing production variable blocks `config apply --yes`
    // before Railway can provision the API or supply web's required API_URL.
    expect(web?.variables?.NEXT_PUBLIC_IMAGEKIT_ID).toEqual(iac.preserve());
    expect(web?.variables?.API_URL).toEqual({
      type: 'literal',
      value: 'https://${{api.RAILWAY_PUBLIC_DOMAIN}}',
    });
    expect(web?.variables?.RPC_IP_SOURCE).toEqual({ type: 'literal', value: 'railway' });
    expect(api?.deploy?.healthcheckPath).toBe('/health');
    expect(api?.variables?.AUTH_PROXY_SECRET).toEqual({
      type: 'reference',
      resource: 'service.movies',
      output: 'BETTER_AUTH_SECRET',
    });
    expect(api?.variables?.DATABASE_URL).toEqual(web?.variables?.DATABASE_URL);
  });
});

describe.each(entrypoints)('%s database deploy patch', (_name, sdk) => {
  it.each(['postgres', 'mysql', 'redis', 'mongo'] as const)(
    'preserves %s sleep and resource limits',
    (engine) => {
      const deploy = {
        sleepApplication: true,
        limitOverride: { containers: { cpu: 1, memoryBytes: 500_000_000 } },
      };

      expect(sdk[engine]('db', { deploy }).deploy).toEqual(deploy);
    },
  );

  it('keeps region placement alongside deploy options', () => {
    const db = sdk.postgres('db', {
      region: 'europe-west4',
      deploy: { sleepApplication: true },
    });

    expect(db.deploy).toEqual({
      sleepApplication: true,
      multiRegionConfig: { 'europe-west4': { numReplicas: 1 } },
    });
  });

  it('lets the explicit region override deploy placement', () => {
    const db = sdk.postgres('db', {
      region: 'europe-west4',
      deploy: { multiRegionConfig: { 'us-west2': { numReplicas: 2 } } },
    });

    expect(db.deploy?.multiRegionConfig).toEqual({ 'europe-west4': { numReplicas: 1 } });
  });

  it('preserves deploy options on the generic database helper', () => {
    const db = sdk.database('db', 'postgres', {
      image: 'postgres:18',
      deploy: { sleepApplication: false },
    });

    expect(db.deploy).toEqual({ sleepApplication: false });
  });

  it('leaves database defaults to Railway when no options are given', () => {
    expect(sdk.postgres('db').deploy).toBeUndefined();
    expect(sdk.postgres('db', { region: 'europe-west4' }).deploy).toEqual({
      multiRegionConfig: { 'europe-west4': { numReplicas: 1 } },
    });
  });
});
