/**
 * 앱 전역에서 사용하는 경로 관련 상수.
 * Header 숨김, 풀스크린, 풀투리프레시/스크롤 비활성 등 일원화하여 중복 제거.
 */

export const FULL_SCREEN_PATHS = ['/', '/login'] as const;

/** 헤더를 숨기는 경로 (Header 컴포넌트·AppShell과 동일 로직) */
export const HEADER_HIDDEN_PATHS = [
  '/',
  '/login',
  '/welcome',
  '/mypage/clubs/apply',
  '/community/write',
  '/mypage/settings/bug-report',
  '/mypage/settings/report',
  '/mypage/settings/name',
] as const;

/** 풀투리프레시 비활성화 경로 (정규식) */
export const PULL_TO_REFRESH_DISABLED_PATHS = [
  /^\/clubs\/[^/]+\/feed$/,
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/new$/,
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/[^/]+\/edit$/,
  /^\/mypage\/settings\/bug-report$/,
  /^\/mypage\/clubs\/apply$/,
  /^\/mypage\/settings(\/|$)/,
  /^\/mypage\/notification-settings(\/|$)/,
  /^\/community\/write$/,
  /^\/community\/posts\/[^/]+\/edit$/,
] as const;

/** 메인 스크롤 비활성 경로 (정규식) */
export const SCROLL_DISABLED_PATHS = [
  /^\/mypage\/clubs\/apply$/,
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/new$/,
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/[^/]+\/edit$/,
  /^\/mypage\/notification-settings(\/|$)/,
  /^\/admin\/?$/,
  /^\/community\/?$/,
  /^\/community\/write$/,
  /^\/community\/posts\/[^/]+\/edit$/,
] as const;

export function isFullScreenPath(pathname: string): boolean {
  return (
    FULL_SCREEN_PATHS.includes(pathname as (typeof FULL_SCREEN_PATHS)[number]) ||
    pathname.startsWith('/login/')
  );
}

export function isHeaderHidden(pathname: string): boolean {
  if (!pathname) return false;
  if (HEADER_HIDDEN_PATHS.includes(pathname as (typeof HEADER_HIDDEN_PATHS)[number])) return true;
  if (pathname.startsWith('/login/') || pathname.startsWith('/welcome/')) return true;
  if (pathname.includes('/feed')) return true;
  if (/^\/mypage\/clubs\/[^/]+\/delete-request$/.test(pathname)) return true;
  if (/^\/community\/posts\/[^/]+\/edit$/.test(pathname)) return true;
  return false;
}

export function isPullToRefreshDisabled(pathname: string): boolean {
  return PULL_TO_REFRESH_DISABLED_PATHS.some((re) => re.test(pathname)) || pathname === '/admin';
}

export function isScrollDisabled(pathname: string): boolean {
  return SCROLL_DISABLED_PATHS.some((re) => re.test(pathname));
}

/** 커뮤니티 게시글 상세(/community/posts/[id])에서만 뒤로가기 표시, 그 외는 기본 헤더 */
export function shouldShowBackButton(pathname: string): boolean {
  return /^\/community\/posts\/[^/]+$/.test(pathname ?? '');
}

const TAB_BASES = ['/home', '/community', '/mypage', '/admin'] as const;
const FROM_QUERY_VALUES = [
  'home',
  '/home',
  'community',
  '/community',
  'mypage',
  '/mypage',
  'admin',
  '/admin',
];

/**
 * 메인 탭(홈/커뮤니티/마이/관리자)에서 파생된 하위 경로인지: 네비 뒤로가기 버튼 표시
 * - 탭 루트가 아닌 하위 경로일 때 true
 * - 동아리 상세(/clubs/[id])에서 from 쿼리가 탭일 때도 true
 */
export function isAnyTabSubRoute(pathname: string, fromQuery: string | null): boolean {
  if (!pathname) return false;
  if (TAB_BASES.some((base) => pathname.startsWith(base) && pathname !== base)) return true;
  if (/^\/clubs\/\d+$/.test(pathname) && fromQuery && FROM_QUERY_VALUES.includes(fromQuery))
    return true;
  return false;
}
