'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import {
  isFullScreenPath,
  isHeaderHidden,
  isPullToRefreshDisabled,
  isScrollDisabled,
} from '@/lib/constants/routes';
import { BottomNav } from '@/components/common/bottom-nav';
import { FloatingButtonsLayer } from '@/components/common/floating-buttons-layer';
import { Header } from '@/components/common/header';
import { PullToRefresh } from '@/components/common/pull-to-refresh';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = pathname ?? '';
  const fullScreen = isFullScreenPath(path);
  const headerHidden = isHeaderHidden(path);
  const pullToRefreshDisabled = isPullToRefreshDisabled(path);
  const scrollDisabled = isScrollDisabled(path);

  // 스크롤 비활성 페이지: html/body + 스크롤 컨테이너 완전 잠금 (position fixed로 본문 스크롤 차단)
  // 다른 탭(홈/마이/관리자)에서 스크롤한 상태로 진입해도 상단부터 보이도록, 잠금 시점에 스크롤을 0으로 초기화함
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (scrollDisabled) {
      const scrollContainer = document.querySelector(
        '[data-scroll-container]'
      ) as HTMLElement | null;
      // 스크롤 잠금 적용 전에 스크롤 위치를 0으로 맞춤 (이전 탭의 스크롤이 그대로 보이는 오류 방지)
      if (scrollContainer) scrollContainer.scrollTo(0, 0);
      window.scrollTo(0, 0);

      const html = document.documentElement;
      const { body } = document;
      const prevHtmlOverflow = html.style.overflow;
      const prevHtmlOverscroll = html.style.overscrollBehavior;
      const prevBodyOverflow = body.style.overflow;
      const prevBodyOverscroll = body.style.overscrollBehavior;
      const prevBodyPosition = body.style.position;
      const prevBodyTop = body.style.top;
      const prevBodyWidth = body.style.width;
      // 항상 0 기준으로 고정 (다른 탭에서 내려온 scrollY를 적용하지 않음)
      html.style.overflow = 'hidden';
      html.style.overscrollBehavior = 'none';
      body.style.overflow = 'hidden';
      body.style.overscrollBehavior = 'none';
      body.style.position = 'fixed';
      body.style.top = '0';
      body.style.width = '100%';
      if (scrollContainer) {
        scrollContainer.style.overflow = 'hidden';
        scrollContainer.style.touchAction = 'none';
        scrollContainer.style.overscrollBehavior = 'none';
      }
      return () => {
        html.style.overflow = prevHtmlOverflow;
        html.style.overscrollBehavior = prevHtmlOverscroll;
        body.style.overflow = prevBodyOverflow;
        body.style.overscrollBehavior = prevBodyOverscroll;
        body.style.position = prevBodyPosition;
        body.style.top = prevBodyTop;
        body.style.width = prevBodyWidth;
        if (scrollContainer) {
          scrollContainer.style.overflow = '';
          scrollContainer.style.touchAction = '';
          scrollContainer.style.overscrollBehavior = '';
        }
      };
    }
  }, [scrollDisabled]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-[var(--card)] shadow-xl ${fullScreen ? 'h-dvh min-h-0' : 'min-h-dvh'}`}
    >
      <Header />
      <main
        className={`flex flex-col overflow-hidden ${fullScreen ? 'h-dvh min-h-0' : 'h-[calc(100dvh-4rem)]'} ${!fullScreen && !headerHidden ? 'pt-[4.25rem]' : ''}`}
      >
        <div className="min-h-0 flex-1 overflow-hidden">
          <PullToRefresh
            fullScreen={fullScreen}
            disabled={pullToRefreshDisabled}
            scrollDisabled={scrollDisabled}
          >
            {children}
          </PullToRefresh>
        </div>
        <FloatingButtonsLayer />
      </main>
      <BottomNav />
    </div>
  );
}
