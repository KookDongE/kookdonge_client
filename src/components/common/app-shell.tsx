'use client';

import { usePathname } from 'next/navigation';

import { BottomNav } from '@/components/common/bottom-nav';
import { Header } from '@/components/common/header';
import { PullToRefresh } from '@/components/common/pull-to-refresh';

const FULL_SCREEN_PATHS = ['/', '/login'];

/** 앱 헤더를 숨기는 경로 (Header 컴포넌트와 동일). 헤더 숨길 때 main 상단 패딩 제거해 컨텐츠가 상단에 붙도록 */
const HEADER_HIDDEN_PATHS = ['/', '/login', '/welcome'];
function isHeaderHidden(pathname: string): boolean {
  if (!pathname) return false;
  if (HEADER_HIDDEN_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/login/') || pathname.startsWith('/welcome/')) return true;
  if (pathname.includes('/feed')) return true;
  return false;
}

/** 풀투리프레시 비활성화 경로 (피드 상세, 피드 생성/수정 — 스크롤·제스처와 충돌 방지) */
const PULL_TO_REFRESH_DISABLED_PATHS = [
  /^\/clubs\/[^/]+\/feed$/, // 피드 상세
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/new$/, // 피드 생성
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/[^/]+\/edit$/, // 피드 수정
];

function isFullScreenPath(pathname: string): boolean {
  return FULL_SCREEN_PATHS.includes(pathname) || pathname.startsWith('/login/');
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreen = isFullScreenPath(pathname ?? '');
  const headerHidden = isHeaderHidden(pathname ?? '');
  const pullToRefreshDisabled = PULL_TO_REFRESH_DISABLED_PATHS.some((re) =>
    re.test(pathname ?? '')
  );

  return (
    <div
      className={`relative mx-auto max-w-md overflow-hidden bg-[var(--card)] shadow-xl ${fullScreen ? 'h-dvh min-h-0' : 'min-h-dvh'}`}
    >
      <Header />
      <main
        className={`flex flex-col overflow-hidden ${fullScreen ? 'h-dvh min-h-0' : 'h-[calc(100dvh-4rem)]'} ${!fullScreen && !headerHidden ? 'pt-[4.25rem]' : ''}`}
      >
        <PullToRefresh fullScreen={fullScreen} disabled={pullToRefreshDisabled}>
          {children}
        </PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
