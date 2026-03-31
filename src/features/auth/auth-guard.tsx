'use client';

import { ReactNode, useLayoutEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { requiresAuthForPath } from '@/lib/constants/auth-routes';

import { useLoginRequiredModalStore } from './login-required-modal-store';
import { getStoredTokens, useAuthStore } from './store';

/**
 * 로그인 필수 경로에 토큰이 없으면 해당 URL로는 머무르지 않고 /home 으로 바꾼 뒤
 * 로그인 필요 모달을 띄웁니다. (링크는 AuthAwareLink로 선제 차단하는 것을 권장)
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const openLoginModal = useLoginRequiredModalStore((s) => s.open);

  const returnPath =
    (pathname ?? '') + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

  useLayoutEffect(() => {
    if (!pathname) return;
    if (!requiresAuthForPath(pathname)) return;
    if (accessToken) return;

    const stored = getStoredTokens();
    if (stored) {
      setTokens(stored.accessToken, stored.refreshToken);
      return;
    }

    // 사용자가 명시적으로 로그아웃/탈퇴를 눌렀을 때는 모달을 띄우지 않음
    try {
      const suppress = sessionStorage.getItem('kookdonge-suppress-login-required-modal') === '1';
      if (suppress) {
        sessionStorage.removeItem('kookdonge-suppress-login-required-modal');
        router.replace('/home');
        return;
      }
    } catch {
      // ignore
    }

    openLoginModal(returnPath);
    router.replace('/home');
  }, [accessToken, pathname, returnPath, router, setTokens, openLoginModal]);

  const needsAuth = pathname ? requiresAuthForPath(pathname) : false;
  const shouldBlock = !accessToken && needsAuth;
  if (shouldBlock) {
    return null;
  }
  return <>{children}</>;
}
