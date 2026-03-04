/**
 * API 디바이스 등록용 플랫폼 구분 (OpenAPI: WEB | ANDROID | IOS)
 * - 빌드 시 NEXT_PUBLIC_PLATFORM이 있으면 사용 (Capacitor/React Native 등)
 * - 없으면 User-Agent로 웹에서 iOS/Android 구분 (PWA·인앱 브라우저)
 */
export type DevicePlatform = 'WEB' | 'IOS' | 'ANDROID';

export function getPlatform(): DevicePlatform {
  if (typeof window === 'undefined') return 'WEB';

  const env = process.env.NEXT_PUBLIC_PLATFORM as DevicePlatform | undefined;
  if (env === 'IOS' || env === 'ANDROID' || env === 'WEB') return env;

  const ua = navigator.userAgent;
  // 맥(Macintosh/macOS)은 항상 데스크톱 취급 (Safari가 iPad 등 UA를 보낼 수 있음)
  if (/Macintosh|Mac OS X/i.test(ua)) return 'WEB';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'IOS';
  if (/Android/i.test(ua)) return 'ANDROID';
  return 'WEB';
}
