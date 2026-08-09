import type { NextConfig } from 'next';
import { env } from './src/env.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
env;

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  cacheLife: {
    // Near-static data (e.g. TMDb genre lists). Served from cache indefinitely
    // with a monthly background refresh; bust on demand via its cache tag.
    genres: {
      stale: 60 * 60 * 24 * 14, // 14 days
      revalidate: 60 * 60 * 24 * 30, // 30 days
      expire: 60 * 60 * 24 * 365, // 1 year
    },
    privateShort: {
      stale: 60, // 1 minute
      revalidate: 60, // 1 minute
      expire: 60 * 5, // 5 minutes
    },
  },
};

export default nextConfig;
