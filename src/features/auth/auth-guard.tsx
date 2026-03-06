'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { getStoredTokens, useAuthStore } from './store';

const PUBLIC_PATHS = ['/', '/login', '/welcome', '/callback'];

/**
 * 보호된 라우트에서 accessToken이 null일 때, 한 프레임만 null인 경우를 위해
 * getStoredTokens()로 복구 시도 후, 한 틱 뒤 다시 확인하고 그래도 없을 때만 / 로 보냅니다.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
    if (isPublic) return;
    if (accessToken) return;

    const stored = getStoredTokens();
    if (stored) {
      setTokens(stored.accessToken, stored.refreshToken);
      return;
    }

    const id = requestAnimationFrame(() => {
      const tokenNow = useAuthStore.getState().accessToken;
      if (tokenNow) return;
      router.replace('/');
    });
    return () => cancelAnimationFrame(id);
  }, [accessToken, pathname, router, setTokens]);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const shouldRedirect = !accessToken && !isPublic;
  if (shouldRedirect) {
    return null;
  }
  return <>{children}</>;
}
