import type { NextConfig } from 'next';
import { env } from './src/env.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
env;

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    loader: 'custom',
    loaderFile: './src/loader.ts',
    formats: ['image/avif', 'image/webp'],
    qualities: [25, 50, 75, 85],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
    ],
  },
  reactCompiler: true,
  cacheComponents: true,
  cacheLife: {
    biweekly: {
      stale: 60 * 60 * 24 * 14, // 14 days
      revalidate: 60 * 60 * 24, // 1 day
      expire: 60 * 60 * 24 * 14, // 14 days
    },
    privateShort: {
      stale: 60, // 1 minute
      revalidate: 60, // 1 minute
      expire: 60 * 5, // 5 minutes
    },
  },
};

export default nextConfig;
