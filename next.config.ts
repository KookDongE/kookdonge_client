import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/admin/community', destination: '/community', permanent: false },
      { source: '/admin/community/:path*', destination: '/community/:path*', permanent: false },
    ];
  },
  turbopack: {
    // 프로젝트 루트를 명시해 여러 lockfile로 인한 잘못된 루트 추론 방지
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
