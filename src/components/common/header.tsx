'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useUnreadCount } from '@/features/notifications/hooks';

export function Header() {
  const pathname = usePathname();
  const { data: unreadCount = 0 } = useUnreadCount();

  const isHidden =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/welcome' ||
    pathname.startsWith('/welcome/') ||
    pathname.includes('/feed');
  if (isHidden) return null;

  return (
    <header className="glass sticky top-0 z-40 border-b-0 pt-3">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/home" className="flex items-center">
          <span className="text-xl font-black tracking-tight text-blue-500 dark:text-lime-400">
            KookDongE
          </span>
        </Link>
        <Link
          href="/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="알림"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] leading-none font-bold text-white"
              aria-label={`읽지 않은 알림 ${unreadCount}개`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
