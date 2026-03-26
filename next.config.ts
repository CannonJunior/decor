import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'sharp'],
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.redd.it' },
      { protocol: 'https', hostname: '**.reddit.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'www.reddit.com' },
      { protocol: 'https', hostname: '**.apartmenttherapy.com' },
      { protocol: 'https', hostname: '**.dezeen.com' },
      { protocol: 'https', hostname: '**.designmilk.com' },
      { protocol: 'https', hostname: '**.thespruce.com' },
      { protocol: 'https', hostname: '**.architecturaldigest.com' },
      { protocol: 'https', hostname: '**.wayfair.com' },
      { protocol: 'https', hostname: '**.ikea.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
