'use client';

import { usePathname } from 'next/navigation';

import { BottomNav } from '@/components/common/bottom-nav';
import { Header } from '@/components/common/header';
import { PullToRefresh } from '@/components/common/pull-to-refresh';

const FULL_SCREEN_PATHS = ['/', '/login'];

/** 풀투리프레시 비활성화 경로 (예: 피드 상세 — 스크롤/제스처와 충돌 방지) */
const PULL_TO_REFRESH_DISABLED_PATH = /^\/clubs\/[^/]+\/feed$/;

function isFullScreenPath(pathname: string): boolean {
  return FULL_SCREEN_PATHS.includes(pathname) || pathname.startsWith('/login/');
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreen = isFullScreenPath(pathname ?? '');
  const pullToRefreshDisabled = PULL_TO_REFRESH_DISABLED_PATH.test(pathname ?? '');

  return (
    <div
      className={`relative mx-auto max-w-md overflow-hidden bg-[var(--card)] shadow-xl ${fullScreen ? 'h-dvh min-h-0' : 'min-h-dvh'}`}
    >
      <Header />
      <main
        className={`flex flex-col overflow-hidden ${fullScreen ? 'h-dvh min-h-0' : 'h-[calc(100dvh-3.5rem-4rem)]'}`}
      >
        <PullToRefresh fullScreen={fullScreen} disabled={pullToRefreshDisabled}>
          {children}
        </PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
