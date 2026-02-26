'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from './store';

const PUBLIC_PATHS = ['/', '/login', '/welcome'];

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
    if (!accessToken && !isPublic) {
      router.replace('/');
    }
  }, [isInitialized, accessToken, pathname, router]);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const shouldRedirect = isInitialized && !accessToken && !isPublic;
  if (shouldRedirect) {
    return null;
  }
  return <>{children}</>;
}
