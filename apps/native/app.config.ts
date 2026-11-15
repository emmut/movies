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
function validateReleaseApiUrl() {
  if (releaseProfiles.has(ENV.EAS_BUILD_PROFILE)) {
    if (!ENV.EXPO_PUBLIC_SERVER_URL || new URL(ENV.EXPO_PUBLIC_SERVER_URL).protocol !== 'https:') {
      throw new Error(
        'Set EXPO_PUBLIC_SERVER_URL to the HTTPS API URL in the EAS environment before building.',
      );
    }
  }
}
function associatedDomains(config: ConfigContext['config']) {
  const associatedDomains = [...(config.ios?.associatedDomains ?? [])];
  if (ENV.EXPO_PUBLIC_PASSKEY_DOMAIN) {
    associatedDomains.push(
      'webcredentials:' + passkeyDomainSchema.parse(ENV.EXPO_PUBLIC_PASSKEY_DOMAIN),
    );
  }
  return [...new Set(associatedDomains)];
}
