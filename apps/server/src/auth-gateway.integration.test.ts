import { createAuthGateway } from '@server/auth-gateway';
import { Pool } from 'pg';
import { expect, it } from 'vite-plus/test';
import { z } from 'zod';

const authUrl = process.env.AUTH_TEST_WEB_URL;
const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;

it.skipIf(!authUrl || !databaseUrl)(
  'authenticates and revokes a real anonymous session through the canonical web service',
  async () => {
    if (!authUrl || !databaseUrl) {
      throw new Error('Integration test configuration is missing');
    }
    for (const url of [authUrl, databaseUrl]) {
      if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) {
        throw new Error('Anonymous auth fixtures require local services');
      }
    }
    const pool = new Pool({ connectionString: databaseUrl, max: 1 });
    const gateway = createAuthGateway(authUrl);
    let userId: string | undefined;
    try {
      const response = await gateway.handle(
        new Request('http://localhost:3001/api/auth/sign-in/anonymous', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'expo-origin': 'movies://',
            'x-skip-oauth-proxy': 'true',
          },
          body: '{}',
        }),
      );
      expect(response.status).toBe(200);
      const raw: unknown = await response.json();
      const created = z
        .object({ user: z.object({ id: z.string(), isAnonymous: z.literal(true) }) })
        .parse(raw);
      userId = created.user.id;
      const cookie = response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');
      expect(cookie).toContain('better-auth.session_token=');
      const identity = await gateway.current(new Headers({ Cookie: cookie }));
      expect(identity?.isAnonymous).toBe(true);
      expect(identity?.id).toBe(userId);
      expect(userId).toBeTruthy();
      const signedOut = await gateway.handle(
        new Request('http://localhost:3001/api/auth/sign-out', {
          method: 'POST',
          headers: {
            Cookie: cookie,
            'Content-Type': 'application/json',
            'expo-origin': 'movies://',
          },
          body: '{}',
        }),
      );
      expect(signedOut.status).toBe(200);
      expect(await gateway.current(new Headers({ Cookie: cookie }))).toBeNull();
    } finally {
      if (userId) {
        await pool.query('delete from "user" where id = $1 and is_anonymous = true', [userId]);
      }
      await pool.end();
    }
  },
  30_000,
);
