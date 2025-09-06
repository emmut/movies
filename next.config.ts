import { NextConfig } from 'next';
import 'src/env';

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
  experimental: {
    reactCompiler: true,
    useCache: true,
    clientSegmentCache: true,
    ppr: true,
  },
};

export default nextConfig;
