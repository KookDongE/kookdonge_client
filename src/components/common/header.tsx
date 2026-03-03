'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useUnreadCount } from '@/features/notifications/hooks';
import { BellIcon } from '@/components/icons/notification-icon';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadCount();
  const isNotificationsPage = pathname === '/notifications';

  const isHidden =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/welcome' ||
    pathname.startsWith('/welcome/') ||
    pathname.includes('/feed');
  if (isHidden) return null;

  return (
    <header className="glass fixed top-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-b-0 pt-3">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/home" className="flex items-center">
          <span className="text-xl font-black tracking-tight text-blue-500 dark:text-lime-400">
            KookDongE
          </span>
        </Link>
        {isNotificationsPage ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="뒤로가기"
          >
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] leading-none font-bold text-white"
                aria-label={`읽지 않은 알림 ${unreadCount}개`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ) : (
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="알림"
          >
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] leading-none font-bold text-white"
                aria-label={`읽지 않은 알림 ${unreadCount}개`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
