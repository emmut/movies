import 'server-only';
import { createAuth } from '@movies/auth';
import { database } from '@server/database';
import { ENV } from '@server/env';

function configureAuth() {
  const {
    BETTER_AUTH_URL,
    BETTER_AUTH_SECRET,
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
  } = ENV;
  if (!BETTER_AUTH_URL) {
    return undefined;
  }
  if (
    !database ||
    !BETTER_AUTH_SECRET ||
    !DISCORD_CLIENT_ID ||
    !DISCORD_CLIENT_SECRET ||
    !GITHUB_CLIENT_ID ||
    !GITHUB_CLIENT_SECRET
  ) {
    throw new Error('Authentication requires a database, signing secret and provider credentials');
  }
  return createAuth(
    {
      BETTER_AUTH_URL,
      BETTER_AUTH_SECRET,
      DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET,
      GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET,
      NODE_ENV: ENV.NODE_ENV,
      AUTH_RATE_LIMIT_DISABLED: ENV.AUTH_RATE_LIMIT_DISABLED,
      BETTER_AUTH_TRUSTED_ORIGIN: ENV.BETTER_AUTH_TRUSTED_ORIGIN,
      PASSKEY_ANDROID_FINGERPRINTS: ENV.PASSKEY_ANDROID_FINGERPRINTS,
    },
    database,
  );
}

export const auth = configureAuth();
