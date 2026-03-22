import type { MetadataRoute } from 'next';

const BASE_URL = 'https://kookdonge.co.kr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/home', '/clubs/', '/community/', '/community/popular', '/community/free', '/community/promo'],
        disallow: ['/admin/', '/mypage/', '/callback', '/login/', '/notifications', '/my/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}