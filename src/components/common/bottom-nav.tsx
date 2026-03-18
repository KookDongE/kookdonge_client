'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { motion } from 'framer-motion';

import { isSystemAdmin, useAuthStore, useMyProfile } from '@/features/auth';

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={active ? 0 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    {/* 집 형태: 선택 시 채움, 비선택 시 아웃라인 */}
    <path d="M12 2L2 12h3v10h6v-6h2v6h6V12h3L12 2z" />
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={active ? 0 : 1.5}
    className="h-6 w-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

const CommunityIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={active ? 0 : 1.5}
    className="h-6 w-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
    />
  </svg>
);

const AdminIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={active ? 0 : 1.5}
    className="h-6 w-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
);

const HOME_ITEM: NavItem = {
  href: '/home',
  label: '홈',
  icon: (active) => <HomeIcon active={active} />,
};

const COMMUNITY_ITEM: NavItem = {
  href: '/community',
  label: '커뮤니티',
  icon: (active) => <CommunityIcon active={active} />,
};

const MYPAGE_ITEM: NavItem = {
  href: '/mypage',
  label: 'MY',
  icon: (active) => <UserIcon active={active} />,
};

const ADMIN_ITEM: NavItem = {
  href: '/admin',
  label: '관리자',
  icon: (active) => <AdminIcon active={active} />,
};

const backSlotTransition = { type: 'tween' as const, duration: 0.25, ease: 'easeOut' as const };

export function BottomNav({ showBackButton = false }: { showBackButton?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  useAuthStore((state) => state.accessToken);
  const { data: profile } = useMyProfile();
  const isAdmin = isSystemAdmin(profile);

  /** 동아리 상세에서 from=/home 으로 들어온 경우 홈 탭 활성 표시 */
  const isFromHome = !!pathname?.match(/^\/clubs\/\d+$/) && searchParams.get('from') === '/home';
  /** 동아리 상세에서 from=/mypage 로 들어온 경우(마이 Q&A 등) MY 탭 활성 표시 */
  const isFromMypage =
    !!pathname?.match(/^\/clubs\/\d+$/) &&
    (searchParams.get('from') === '/mypage' || searchParams.get('from') === 'mypage');

  /** 알림 페이지에서 from 쿼리로 진입 시, 해당 탭 활성 표시 */
  const fromQuery = searchParams.get('from');
  const notificationsFromHref =
    pathname === '/notifications' && fromQuery
      ? fromQuery === 'home' || fromQuery === '/home'
        ? '/home'
        : fromQuery === 'community' || fromQuery === '/community'
          ? '/community'
          : fromQuery === 'mypage' || fromQuery === '/mypage'
            ? '/mypage'
            : fromQuery === 'admin' || fromQuery === '/admin'
              ? '/admin'
              : null
      : null;

  const isHidden =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/welcome' ||
    pathname.startsWith('/welcome/') ||
    pathname?.startsWith('/community/posts/') ||
    pathname === '/community/write' ||
    pathname === '/mypage/clubs/apply' ||
    pathname?.includes('/manage/feed/new') ||
    pathname === '/mypage/settings/bug-report' ||
    pathname === '/mypage/settings/name';

  const isActive = useCallback(
    (href: string) => {
      if (pathname === '/notifications' && notificationsFromHref)
        return href === notificationsFromHref;
      if (href === '/home') return pathname === '/home' || isFromHome;
      if (href === '/admin') return pathname?.startsWith('/admin'); // 관리자 메인·하위 페이지 모두 탭 활성
      if (href === '/mypage')
        return (
          isFromMypage ||
          pathname === '/mypage' ||
          !!pathname?.startsWith('/mypage/') ||
          !!pathname?.startsWith('/my/')
        ); // 마이 하위·신청한 동아리(/my/*)·동아리 상세(from=mypage) 포함
      if (href.includes('?')) return false;
      return pathname.startsWith(href);
    },
    [pathname, isFromHome, isFromMypage, notificationsFromHref]
  );

  // 순서: 홈 → 커뮤니티 → 마이 → 관리자(관리자만)
  const allNavItems = useMemo<NavItem[]>(
    () => [HOME_ITEM, COMMUNITY_ITEM, MYPAGE_ITEM, ...(isAdmin ? [ADMIN_ITEM] : [])],
    [isAdmin]
  );

  if (isHidden) return null;

  // 배경과 동일한 불투명 배경으로 하단 네비 고정
  const navClassName =
    'fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-t-2xl border-t-0 pb-[env(safe-area-inset-bottom)] bg-white/90 backdrop-blur-sm dark:bg-zinc-900/90';

  const scrollHomeToTop = () => {
    const el = document.querySelector('[data-scroll-container]') as HTMLElement | null;
    if (el) el.scrollTo(0, 0);
  };

  return (
    <nav className={navClassName}>
      <div
        className={`relative flex items-center py-2 ${showBackButton ? 'justify-start gap-0 px-5' : 'justify-around'}`}
      >
        {/* 뒤로가기 슬롯: width 0 ↔ 슬롯 확장, layout으로 탭들과 함께 전환 */}
        <motion.div
          className="flex min-w-0 shrink-0 flex-col items-center justify-center overflow-hidden"
          layout
          animate={{
            width: showBackButton ? 56 : 0,
            flex: showBackButton ? 0 : 0,
            opacity: showBackButton ? 1 : 0,
          }}
          transition={backSlotTransition}
          style={{ minWidth: 0 }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            aria-label="뒤로 가기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        </motion.div>
        {/* 탭: 각 링크 안에 인디케이터를 두어 활성 탭 위에만 선이 오도록 */}
        <div className="flex flex-1 items-center justify-around py-2">
          {allNavItems.map((item) => {
            const active = isActive(item.href);
            const href = item.href;
            const isHomeLink = href === '/home';

            return (
              <Link
                key={item.href}
                href={href}
                onClick={
                  isHomeLink && pathname === '/home'
                    ? (e) => {
                        e.preventDefault();
                        scrollHomeToTop();
                      }
                    : undefined
                }
                className="relative flex min-w-[64px] flex-col items-center gap-0.5 py-2 outline-none"
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-blue-500 dark:bg-lime-400"
                    aria-hidden
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`transition-colors ${
                    active ? 'text-blue-500 dark:text-lime-400' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {item.icon(active)}
                </motion.div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? 'text-blue-500 dark:text-lime-400' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
