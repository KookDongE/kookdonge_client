'use client';

import { usePathname } from 'next/navigation';

import { BottomNav } from '@/components/common/bottom-nav';
import { Header } from '@/components/common/header';
import { PullToRefresh } from '@/components/common/pull-to-refresh';

const FULL_SCREEN_PATHS = ['/', '/login'];

function isFullScreenPath(pathname: string): boolean {
  return FULL_SCREEN_PATHS.includes(pathname) || pathname.startsWith('/login/');
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreen = isFullScreenPath(pathname ?? '');

  return (
    <div
      className={`relative mx-auto max-w-md overflow-hidden bg-[var(--card)] shadow-xl ${fullScreen ? 'h-dvh min-h-0' : 'min-h-dvh'}`}
    >
      <Header />
      <main
        className={`flex flex-col overflow-hidden ${fullScreen ? 'h-dvh min-h-0' : 'h-[calc(100dvh-3.5rem-4rem)]'}`}
      >
        <PullToRefresh fullScreen={fullScreen}>{children}</PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
