import 'varlock/auto-load';
import { passkeyDomainSchema } from '@movies/config/passkeys';
import type { ConfigContext, ExpoConfig } from 'expo/config';

import { ENV } from './src/env.ts';

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  validateReleaseApiUrl();
  return {
    ...config,
    name: config.name ?? 'Movies',
    slug: config.slug ?? 'movies',
    ios: {
      ...config.ios,
      associatedDomains: associatedDomains(config),
    },
  };
}

const releaseProfiles = new Set<string | undefined>(['preview', 'production']);

function isHttpsUrl(value: string | undefined) {
  if (!value) {
    return false;
  }
  return new URL(value).protocol === 'https:';
}

function validateReleaseApiUrl() {
  if (!releaseProfiles.has(ENV.EAS_BUILD_PROFILE)) {
    return;
  }
  if (!isHttpsUrl(ENV.EXPO_PUBLIC_SERVER_URL)) {
    throw new Error(
      'Set EXPO_PUBLIC_SERVER_URL to the HTTPS API URL in the EAS environment before building.',
    );
  }
}

function associatedDomains(config: ConfigContext['config']) {
  const domains = [...(config.ios?.associatedDomains ?? [])];
  if (ENV.EXPO_PUBLIC_PASSKEY_DOMAIN) {
    domains.push(`webcredentials:${passkeyDomainSchema.parse(ENV.EXPO_PUBLIC_PASSKEY_DOMAIN)}`);
  }
  return [...new Set(domains)];
}
