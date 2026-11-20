import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vite-plus/test';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));

it.each(['build', 'dev'])('preserves the product API origin in Turbo strict %s tasks', (task) => {
  const apiUrl = 'https://api.preview.example.com';
  const output = execFileSync(
    process.execPath,
    [require.resolve('turbo/bin/turbo'), 'run', task, '--filter=@movies/web', '--dry=json'],
    { cwd: root, env: { ...process.env, API_URL: apiUrl }, encoding: 'utf8' },
  );
  const report = JSON.parse(output) as {
    tasks: { taskId: string; environmentVariables: { configured: string[] } }[];
  };
  const web = report.tasks.find((entry) => entry.taskId === `@movies/web#${task}`);
  const hash = createHash('sha256').update(apiUrl).digest('hex');
  expect(web?.environmentVariables.configured).toContain(`API_URL=${hash}`);
});

it('preserves the Hono auth configuration in Turbo strict dev tasks', () => {
  const config = {
    BETTER_AUTH_URL: 'https://movies.example.com',
    BETTER_AUTH_SECRET: 'auth-secret-fixture-for-strict-mode',
  };
  const output = execFileSync(
    process.execPath,
    [require.resolve('turbo/bin/turbo'), 'run', 'dev', '--filter=@movies/server', '--dry=json'],
    { cwd: root, env: { ...process.env, ...config }, encoding: 'utf8' },
  );
  const report = JSON.parse(output) as {
    tasks: { taskId: string; environmentVariables: { configured: string[] } }[];
  };
  const server = report.tasks.find((entry) => entry.taskId === '@movies/server#dev');
  for (const [name, value] of Object.entries(config)) {
    const hash = createHash('sha256').update(value).digest('hex');
    expect(server?.environmentVariables.configured).toContain(`${name}=${hash}`);
  }
});
