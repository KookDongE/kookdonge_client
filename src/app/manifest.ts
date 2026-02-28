import type { MetadataRoute } from 'next';

/** 폰에서 '홈에 추가' 시 아이콘이 나오도록 manifest 아이콘은 절대 URL 권장. NEXT_PUBLIC_APP_URL 설정 시 사용 */
function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url || typeof url !== 'string') return '';
  return url.replace(/\/$/, '');
}

/** Web App Manifest 스펙의 media(테마별 아이콘)는 지원하나 Next.js Icon 타입에 없어 단언 사용 */
type ManifestIconWithMedia = NonNullable<MetadataRoute.Manifest['icons']>[number] & {
  media?: string;
};

export default function manifest(): MetadataRoute.Manifest {
  const base = getBaseUrl();
  const icon = (path: string) => (base ? `${base}${path}` : path);

  const icons: ManifestIconWithMedia[] = [
    {
      src: icon('/icons/icon-light-192.png'),
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
      media: '(prefers-color-scheme: light)',
    },
    {
      src: icon('/icons/icon-light-192.png'),
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
      media: '(prefers-color-scheme: light)',
    },
    {
      src: icon('/icons/icon-light-512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
      media: '(prefers-color-scheme: light)',
    },
    {
      src: icon('/icons/icon-light-512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
      media: '(prefers-color-scheme: light)',
    },
    {
      src: icon('/icons/icon-dark-192.png'),
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
      media: '(prefers-color-scheme: dark)',
    },
    {
      src: icon('/icons/icon-dark-192.png'),
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
      media: '(prefers-color-scheme: dark)',
    },
    {
      src: icon('/icons/icon-dark-512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
      media: '(prefers-color-scheme: dark)',
    },
    {
      src: icon('/icons/icon-dark-512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
      media: '(prefers-color-scheme: dark)',
    },
  ];

  return {
    id: '/',
    name: 'KookDongE',
    short_name: '국동이',
    description: '국민대 동아리 정보 모음이',
    start_url: '/',
    display: 'standalone',
    background_color: '#3B82F6',
    theme_color: '#3B82F6',
    orientation: 'portrait',
    icons: icons as MetadataRoute.Manifest['icons'],
  };
}
