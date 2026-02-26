'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore, getStoredTokens } from './store';

const PUBLIC_PATHS = ['/', '/login', '/welcome', '/callback'];

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const setTokens = useAuthStore((s) => s.setTokens);

  useEffect(() => {
    if (!isInitialized) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
    if (isPublic) return;

    if (accessToken) return;

    // 스토어에는 아직 없지만 localStorage에 토큰이 있으면 복원 (재수화 타이밍 이슈 방지)
    const stored = getStoredTokens();
    if (stored) {
      setTokens(stored.accessToken, stored.refreshToken);
      return;
    }

    router.replace('/');
  }, [isInitialized, accessToken, pathname, router, setTokens]);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const shouldRedirect = isInitialized && !accessToken && !isPublic;
  if (shouldRedirect) {
    return null;
  }
  return <>{children}</>;
}
