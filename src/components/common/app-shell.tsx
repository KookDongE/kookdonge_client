'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { BottomNav } from '@/components/common/bottom-nav';
import { PullToRefresh } from '@/components/common/pull-to-refresh';

const FULL_SCREEN_PATHS = ['/', '/login'];

/** 풀투리프레시 비활성화 경로 (피드 상세, 피드 생성/수정, 버그 신고, 동아리 신청, 설정, 알림설정, 커뮤니티 메인·글쓰기만 — 인기/홍보/자유 게시판은 풀투리프레시 가능) */
const PULL_TO_REFRESH_DISABLED_PATHS = [
  /^\/clubs\/[^/]+\/feed$/, // 피드 상세
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/new$/, // 피드 생성
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/[^/]+\/edit$/, // 피드 수정
  /^\/mypage\/settings\/bug-report$/, // 버그 신고
  /^\/mypage\/clubs\/apply$/, // 동아리 신청
  /^\/mypage\/settings(\/|$)/, // 설정 (메인·이름변경·버그신고 등 하위 포함)
  /^\/mypage\/notification-settings(\/|$)/, // 알림설정
  /^\/admin\/community\/write$/, // 글쓰기 페이지
  /^\/admin\/community\/?$/, // 커뮤니티 메인만 (인기/홍보/자유 게시판은 풀투리프레시 가능)
];

/** 메인 스크롤 비활성화 경로 (동아리 신청, 피드 추가/수정, 설정 메인만, 알림설정, 관리자 메인만, 커뮤니티 메인·글쓰기 — 하위 페이지는 스크롤 가능) */
const SCROLL_DISABLED_PATHS = [
  /^\/mypage\/clubs\/apply$/,
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/new$/, // 피드 추가
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/[^/]+\/edit$/, // 피드 수정
  /^\/mypage\/settings\/?$/, // 설정 메인만 (/mypage/settings, /mypage/settings/) — 하위(이름변경, 버그신고 등) 제외
  /^\/mypage\/notification-settings(\/|$)/,
  /^\/admin\/?$/, // 관리자 메인만 (trailing slash 포함)
  /^\/admin\/community\/?$/, // 커뮤니티 메인만, 하위(/admin/community/popular 등)는 스크롤 가능. trailing slash 포함.
  /^\/admin\/community\/write$/, // 글쓰기 페이지 스크롤 비활성
];

function isFullScreenPath(pathname: string): boolean {
  return FULL_SCREEN_PATHS.includes(pathname) || pathname.startsWith('/login/');
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreen = isFullScreenPath(pathname ?? '');
  const pullToRefreshDisabled =
    PULL_TO_REFRESH_DISABLED_PATHS.some((re) => re.test(pathname ?? '')) || pathname === '/admin'; // 관리자 메인 페이지만 비활성, 하위(/admin/applications 등)는 풀리프래시 활성
  const scrollDisabled = SCROLL_DISABLED_PATHS.some((re) => re.test(pathname ?? ''));

  // 스크롤 비활성 페이지: html/body + 스크롤 컨테이너 완전 잠금 (position fixed로 본문 스크롤 차단)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (scrollDisabled) {
      const html = document.documentElement;
      const { body } = document;
      const prevHtmlOverflow = html.style.overflow;
      const prevHtmlOverscroll = html.style.overscrollBehavior;
      const prevBodyOverflow = body.style.overflow;
      const prevBodyOverscroll = body.style.overscrollBehavior;
      const prevBodyPosition = body.style.position;
      const prevBodyTop = body.style.top;
      const prevBodyWidth = body.style.width;
      const scrollY = window.scrollY;
      html.style.overflow = 'hidden';
      html.style.overscrollBehavior = 'none';
      body.style.overflow = 'hidden';
      body.style.overscrollBehavior = 'none';
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
      const scrollContainer = document.querySelector('[data-scroll-container]') as HTMLElement | null;
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
        if (scrollY) window.scrollTo(0, scrollY);
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
      <main
        className={`flex flex-col overflow-hidden ${fullScreen ? 'h-dvh min-h-0' : 'h-[calc(100dvh-4rem)]'}`}
      >
        <PullToRefresh
          fullScreen={fullScreen}
          disabled={pullToRefreshDisabled}
          scrollDisabled={scrollDisabled}
        >
          {children}
        </PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
