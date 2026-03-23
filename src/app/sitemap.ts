import type { MetadataRoute } from 'next';

const BASE_URL = 'https://kookdonge.co.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];
}
