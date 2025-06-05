import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
    ],
  },
  experimental: {
    ppr: true,
    reactCompiler: true,
  },
};

export default nextConfig;
