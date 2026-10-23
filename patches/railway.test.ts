import { createRequire } from 'node:module';

import * as railway from 'railway';
import * as iac from 'railway/iac';
import { describe, expect, it } from 'vite-plus/test';

const require = createRequire(import.meta.url);
const entrypoints: [string, typeof iac][] = [
  ['railway (ESM)', railway],
  ['railway/iac (ESM)', iac],
  ['railway (CommonJS)', require('railway')],
  ['railway/iac (CommonJS)', require('railway/iac')],
];

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
