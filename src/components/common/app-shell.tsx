'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { BottomNav } from '@/components/common/bottom-nav';
import { Header } from '@/components/common/header';
import { PullToRefresh } from '@/components/common/pull-to-refresh';

const FULL_SCREEN_PATHS = ['/', '/login'];

/** 앱 헤더를 숨기는 경로 (Header 컴포넌트와 동일). 헤더 숨길 때 main 상단 패딩 제거 */
const HEADER_HIDDEN_PATHS = ['/', '/login', '/welcome', '/mypage/clubs/apply', '/community/write', '/mypage/settings/bug-report', '/mypage/settings/report', '/mypage/settings/name'];
function isHeaderHidden(pathname: string): boolean {
  if (!pathname) return false;
  if (HEADER_HIDDEN_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/login/') || pathname.startsWith('/welcome/')) return true;
  if (pathname.includes('/feed')) return true;
  if (/^\/mypage\/clubs\/[^/]+\/delete-request$/.test(pathname)) return true; // 동아리 삭제 신청
  return false;
}

/** 풀투리프레시 비활성화 경로 (피드 상세, 피드 생성/수정, 버그 신고, 동아리 신청, 설정, 알림설정, 글쓰기만 — 커뮤니티 메인·인기/홍보/자유 등 하위는 풀투리프레시 가능) */
const PULL_TO_REFRESH_DISABLED_PATHS = [
  /^\/clubs\/[^/]+\/feed$/, // 피드 상세
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/new$/, // 피드 생성
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/[^/]+\/edit$/, // 피드 수정
  /^\/mypage\/settings\/bug-report$/, // 버그 신고
  /^\/mypage\/clubs\/apply$/, // 동아리 신청
  /^\/mypage\/settings(\/|$)/, // 설정 (메인·이름변경·버그신고 등 하위 포함)
  /^\/mypage\/notification-settings(\/|$)/, // 알림설정
  /^\/community\/write$/, // 커뮤니티 글쓰기 — 풀투리프레시 비활성
];

/** 메인 스크롤 비활성화 경로 (동아리 신청, 피드 추가/수정, 설정 메인만, 알림설정, 관리자 메인만, 커뮤니티 메인·글쓰기 — 하위 페이지는 스크롤 가능) */
const SCROLL_DISABLED_PATHS = [
  /^\/mypage\/clubs\/apply$/,
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/new$/, // 피드 추가
  /^\/mypage\/clubs\/[^/]+\/manage\/feed\/[^/]+\/edit$/, // 피드 수정
  /^\/mypage\/settings\/?$/, // 설정 메인만 (/mypage/settings, /mypage/settings/) — 하위(이름변경, 버그신고 등) 제외
  /^\/mypage\/notification-settings(\/|$)/,
  /^\/admin\/?$/, // 관리자 메인만 (trailing slash 포함)
  /^\/community\/?$/, // 커뮤니티 메인만, 하위(/community/popular 등)는 스크롤 가능. trailing slash 포함.
  /^\/community\/write$/, // 글쓰기 페이지 스크롤 비활성
];

function isFullScreenPath(pathname: string): boolean {
  return FULL_SCREEN_PATHS.includes(pathname) || pathname.startsWith('/login/');
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreen = isFullScreenPath(pathname ?? '');
  const headerHidden = isHeaderHidden(pathname ?? '');
  const pullToRefreshDisabled =
    PULL_TO_REFRESH_DISABLED_PATHS.some((re) => re.test(pathname ?? '')) || pathname === '/admin'; // 관리자 메인 페이지만 비활성, 하위(/admin/applications 등)는 풀리프래시 활성
  const scrollDisabled = SCROLL_DISABLED_PATHS.some((re) => re.test(pathname ?? ''));

  // 스크롤 비활성 페이지: html/body + 스크롤 컨테이너 완전 잠금 (position fixed로 본문 스크롤 차단)
  // 다른 탭(홈/마이/관리자)에서 스크롤한 상태로 진입해도 상단부터 보이도록, 잠금 시점에 스크롤을 0으로 초기화함
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (scrollDisabled) {
      const scrollContainer = document.querySelector('[data-scroll-container]') as HTMLElement | null;
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
      const scrollY = 0;
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
