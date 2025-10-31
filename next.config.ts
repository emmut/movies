import { type NextConfig } from 'next';
import { env } from './src/env.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
env;

const nextConfig: NextConfig = {
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
  experimental: {
    clientSegmentCache: true,
  },
  output: 'standalone',
};

export default nextConfig;
