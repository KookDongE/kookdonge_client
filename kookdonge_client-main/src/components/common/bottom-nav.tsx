'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { motion } from 'framer-motion';

import { useAuthStore } from '@/features/auth/store';

const HIDDEN_PATHS = ['/login', '/register'];

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
    className="h-6 w-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
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

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: '홈',
    icon: (active) => <HomeIcon active={active} />,
  },
  {
    href: '/mypage',
    label: 'MY',
    icon: (active) => <UserIcon active={active} />,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicatorLeft, setIndicatorLeft] = useState(0);
  const accessToken = useAuthStore((state) => state.accessToken);
  
  // 임시: 관리자 권한 체크 (실제로는 서버에서 받아온 user.role === 'ADMIN' 등으로 확인)
  const isAdmin = true; // TODO: 실제 권한 체크로 교체

  if (HIDDEN_PATHS.some((path) => pathname === path || pathname.startsWith(path))) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.includes('?')) return false;
    return pathname.startsWith(href);
  };

  // 관리자 탭 포함한 전체 아이템 목록
  const allNavItems = [
    ...NAV_ITEMS,
    ...(isAdmin
      ? [
          {
            href: '/admin',
            label: '관리자',
            icon: (active: boolean) => <AdminIcon active={active} />,
          },
        ]
      : []),
  ];

  // 활성 링크의 위치 계산
  useEffect(() => {
    const activeIndex = allNavItems.findIndex((item) => isActive(item.href));
    if (activeIndex !== -1 && linkRefs.current[activeIndex]) {
      const linkElement = linkRefs.current[activeIndex];
      if (linkElement) {
        const navElement = linkElement.closest('nav');
        if (navElement) {
          const navRect = navElement.getBoundingClientRect();
          const linkRect = linkElement.getBoundingClientRect();
          const left = linkRect.left - navRect.left + linkRect.width / 2 - 12; // 12 = w-6 / 2
          setIndicatorLeft(left);
        }
      }
    }
  }, [pathname, isAdmin]);

  // 피드 페이지에서는 더 선명한 네비게이션 바
  const isFeedPage = pathname.includes('/feed');
  const navClassName = isFeedPage
    ? 'fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-t-2xl border-t-0 pb-[env(safe-area-inset-bottom)] bg-white/95 backdrop-blur-xl dark:bg-zinc-900/95'
    : 'glass fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-t-2xl border-t-0 pb-[env(safe-area-inset-bottom)]';

  const activeIndex = allNavItems.findIndex((item) => isActive(item.href));

  return (
    <nav className={navClassName}>
      <div className="relative flex items-center justify-around py-2">
        {allNavItems.map((item, index) => {
          const active = isActive(item.href);
          const href = item.href;

          return (
            <Link
              key={item.href}
              ref={(el) => {
                linkRefs.current[index] = el;
              }}
              href={href}
              className="relative flex min-w-[64px] flex-col items-center gap-0.5 py-2"
            >
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
        {activeIndex !== -1 && (
          <motion.div
            className="absolute -top-1 h-1 w-6 rounded-full bg-blue-500 dark:bg-lime-400"
            animate={{ left: indicatorLeft }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </div>
    </nav>
  );
}
