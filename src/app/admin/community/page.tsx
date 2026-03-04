'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { PageCenteredSkeleton } from '@/components/common/skeletons';

const MENU_ITEMS = [
  { href: '/admin/community/my-posts', label: '내가 쓴 글' },
  { href: '/admin/community/commented', label: '댓글 단 글' },
  { href: '/admin/community/saved', label: '저장한 글' },
  { href: '/admin/community/popular', label: '인기게시판' },
  { href: '/admin/community/promo', label: '홍보게시판' },
  { href: '/admin/community/free', label: '자유게시판' },
] as const;

export default function AdminCommunityPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  if (profileLoading || (profile && !isSystemAdmin(profile))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageCenteredSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-zinc-900">
      <div className="px-4 py-4">
        <div className="space-y-3">
          {MENU_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80"
            >
              {label}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
