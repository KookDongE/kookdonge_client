import type { MetadataRoute } from 'next';

const BASE_URL = 'https://kookdonge.co.kr';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kookdonge.co.kr';

/** 정적 공개 페이지 */
const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
  { path: '/home', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/login', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: '/community', priority: 0.8, changeFrequency: 'daily' as const },
  { path: '/community/popular', priority: 0.7, changeFrequency: 'daily' as const },
  { path: '/community/free', priority: 0.7, changeFrequency: 'daily' as const },
  { path: '/community/promo', priority: 0.7, changeFrequency: 'daily' as const },
  { path: '/welcome', priority: 0.4, changeFrequency: 'monthly' as const },
  { path: '/mypage/settings/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/mypage/settings/terms', priority: 0.3, changeFrequency: 'yearly' as const },
  {
    path: '/mypage/settings/youth-protection',
    priority: 0.3,
    changeFrequency: 'yearly' as const,
  },
  {
    path: '/mypage/settings/community-rules',
    priority: 0.3,
    changeFrequency: 'yearly' as const,
  },
];

type ClubListApiRes = {
  status: number;
  data: {
    content: Array<{ clubId: number }>;
    totalPages: number;
  };
};

async function fetchClubIds(): Promise<number[]> {
  try {
    const ids: number[] = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
      const res = await fetch(
        `${API_BASE_URL}/api/clubs?page=${page}&size=100&sort=latest`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) break;

      const json = (await res.json()) as ClubListApiRes;
      const data = json?.data;
      if (!data?.content) break;

      ids.push(...data.content.map((c) => c.clubId));
      totalPages = data.totalPages ?? 1;
      page++;
    }

    return ids;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const clubIds = await fetchClubIds();
  const clubEntries: MetadataRoute.Sitemap = clubIds.map((id) => ({
    url: `${BASE_URL}/clubs/${id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...clubEntries];
}