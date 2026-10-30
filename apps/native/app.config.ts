import 'varlock/auto-load';
import { passkeyDomainSchema } from '@movies/config/passkeys';
import type { ConfigContext, ExpoConfig } from 'expo/config';

import { ENV } from './src/env.ts';

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  if (ENV.EAS_BUILD_PROFILE === 'preview' || ENV.EAS_BUILD_PROFILE === 'production') {
    if (!ENV.EXPO_PUBLIC_SERVER_URL || new URL(ENV.EXPO_PUBLIC_SERVER_URL).protocol !== 'https:') {
      throw new Error(
        'Set EXPO_PUBLIC_SERVER_URL to the HTTPS API URL in the EAS environment before building.',
      );
    }
  }
  const associatedDomains = [...(config.ios?.associatedDomains ?? [])];
  if (ENV.EXPO_PUBLIC_PASSKEY_DOMAIN) {
    associatedDomains.push(
      'webcredentials:' + passkeyDomainSchema.parse(ENV.EXPO_PUBLIC_PASSKEY_DOMAIN),
    );
  }
  return {
    ...config,
    name: config.name ?? 'Movies',
    slug: config.slug ?? 'movies',
    ios: {
      ...config.ios,
      associatedDomains: [...new Set(associatedDomains)],
    },
  };
}
