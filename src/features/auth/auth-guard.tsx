'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from './store';

const PUBLIC_PATHS = ['/', '/login', '/welcome', '/callback'];

/**
 * AuthProvider가 재수화 완료 후에만 마운트되므로, 여기서는 스토어 상태만 신뢰합니다.
 * localStorage 직접 참조 없이 accessToken 유무만으로 인증 여부를 판단합니다.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
    if (isPublic) return;
    if (accessToken) return;
    router.replace('/');
  }, [accessToken, pathname, router]);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const shouldRedirect = !accessToken && !isPublic;
  if (shouldRedirect) {
    return null;
  }
  return <>{children}</>;
}
