/**
 * 로그인 필수 경로만 정의합니다. 그 외 경로는 비로그인(게스트) 접근을 허용합니다.
 * AuthGuard·API 401 처리·로그인 복귀 URL에서 공통으로 사용합니다.
 */

export const OAUTH_POST_LOGIN_REDIRECT_KEY = 'kookdonge-post-login-redirect';

/** 내부 라우트로만 복귀 (오픈 리다이렉트 방지) */
export function sanitizeInternalPath(path: string): string {
  const p = path.trim();
  if (!p.startsWith('/') || p.startsWith('//')) return '/home';
  if (p === '/login' || p.startsWith('/login?') || p.startsWith('/login/')) return '/home';
  return p;
}

/**
 * 이 경로를 **화면으로 열려면** 로그인이 필요한지 여부.
 * (게스트는 /login?returnUrl=… 으로 보냄)
 */
export function requiresAuthForPath(pathname: string): boolean {
  if (!pathname) return false;

  if (pathname === '/' || pathname === '/login' || pathname === '/welcome' || pathname === '/callback')
    return false;
  if (pathname.startsWith('/login/')) return false;
  if (pathname.startsWith('/welcome/')) return false;
  if (pathname.startsWith('/callback')) return false;

  if (pathname.startsWith('/mypage')) return true;
  if (pathname.startsWith('/notifications')) return true;
  if (pathname.startsWith('/admin')) return true;
  if (pathname === '/my' || pathname.startsWith('/my/')) return true;

  if (pathname === '/community/write') return true;
  if (pathname === '/community/my-posts') return true;
  if (pathname === '/community/saved') return true;
  if (pathname === '/community/liked') return true;
  if (pathname === '/community/commented') return true;
  if (/^\/community\/posts\/[^/]+\/edit$/.test(pathname)) return true;

  return false;
}

export function buildLoginUrl(returnPath: string): string {
  const safe = sanitizeInternalPath(returnPath);
  return `/login?returnUrl=${encodeURIComponent(safe)}`;
}

export function setPostLoginRedirect(path: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(OAUTH_POST_LOGIN_REDIRECT_KEY, sanitizeInternalPath(path));
  } catch {
    // ignore
  }
}

export function consumePostLoginRedirect(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(OAUTH_POST_LOGIN_REDIRECT_KEY);
    sessionStorage.removeItem(OAUTH_POST_LOGIN_REDIRECT_KEY);
    if (raw && raw.startsWith('/') && !raw.startsWith('//')) return sanitizeInternalPath(raw);
  } catch {
    // ignore
  }
  return null;
}

export function getReturnUrlFromSearchParam(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    return sanitizeInternalPath(decoded);
  } catch {
    return null;
  }
}

/** Next.js `Link`의 href에서 pathname + search만 뽑아 복귀 URL로 씁니다. */
export function hrefToReturnPath(href: string | import('url').UrlObject): string {
  if (typeof href === 'string') {
    if (!href.startsWith('/')) return '/home';
    return href.split('#')[0];
  }
  const pathname = href.pathname ?? '/';
  const search =
    typeof href.search === 'string'
      ? href.search
      : href.query != null && typeof href.query === 'object' && !Array.isArray(href.query)
        ? `?${new URLSearchParams(href.query as Record<string, string>).toString()}`
        : '';
  return pathname + search;
}

export function requiresAuthForHref(href: string | import('url').UrlObject): boolean {
  const full = hrefToReturnPath(href);
  const pathnameOnly = full.split('?')[0] ?? '';
  return requiresAuthForPath(pathnameOnly);
}
