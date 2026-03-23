import type { MetadataRoute } from 'next';

const BASE_URL = 'https://kookdonge.co.kr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/home',
          '/clubs/',
          '/community/',
          '/admin/',
          '/mypage/',
          '/callback',
          '/login/',
          '/welcome',
          '/notifications',
          '/my/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
