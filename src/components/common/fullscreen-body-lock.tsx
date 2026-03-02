'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const FULLSCREEN_PATHS = ['/', '/login'];

function isFullScreenPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return FULLSCREEN_PATHS.includes(pathname) || pathname.startsWith('/login/');
}

/**
 * 스플래시·로그인 등 풀스크린 페이지에서 body/html 스크롤 및 스크롤바 완전 차단 (윈도우 대응)
 */
export function FullscreenBodyLock() {
  const pathname = usePathname();
  const fullScreen = isFullScreenPath(pathname);

  useEffect(() => {
    const el = document.documentElement;
    if (fullScreen) {
      el.classList.add('fullscreen-page');
    } else {
      el.classList.remove('fullscreen-page');
    }
    return () => el.classList.remove('fullscreen-page');
  }, [fullScreen]);

  return null;
}
