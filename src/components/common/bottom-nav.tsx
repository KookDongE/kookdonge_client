'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { motion } from 'framer-motion';

import { isSystemAdmin, useAuthStore, useMyProfile } from '@/features/auth';

const isInputFocused = () => {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  const role = (el.getAttribute('role') ?? '').toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    role === 'textbox' ||
    el.getAttribute('contenteditable') === 'true'
  );
};

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
    href: '/home',
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
  const [inputFocused, setInputFocused] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { data: profile } = useMyProfile();
  const isAdmin = isSystemAdmin(profile);

  // 앱뷰에서 입력 중/스크롤 시 네비가 입력창 위로 올라오는 것 방지: 입력 포커스 시 하단 네비 숨김
  useEffect(() => {
    const handleFocusChange = () => {
      requestAnimationFrame(() => setInputFocused(isInputFocused()));
    };
    handleFocusChange();
    document.addEventListener('focusin', handleFocusChange);
    document.addEventListener('focusout', handleFocusChange);
    return () => {
      document.removeEventListener('focusin', handleFocusChange);
      document.removeEventListener('focusout', handleFocusChange);
    };
  }, []);

  const isHidden =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/welcome' ||
    pathname.startsWith('/welcome/');

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
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

  // 활성 링크의 위치 계산 (훅은 조건부 return 이전에 항상 호출)
  useEffect(() => {
    if (isHidden) return;
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
  }, [pathname, isAdmin, isHidden]);

  if (isHidden) return null;

  // 피드 페이지에서는 더 선명한 네비게이션 바
  const isFeedPage = pathname.includes('/feed');
  const navClassName = [
    isFeedPage
      ? 'fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-t-2xl border-t-0 pb-[env(safe-area-inset-bottom)] bg-white/95 backdrop-blur-xl dark:bg-zinc-900/95'
      : 'glass fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-t-2xl border-t-0 pb-[env(safe-area-inset-bottom)]',
    'transition-transform duration-200 ease-out',
    inputFocused ? 'translate-y-full pointer-events-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
              className="relative flex min-w-[64px] flex-col items-center gap-0.5 py-2 outline-none"
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
