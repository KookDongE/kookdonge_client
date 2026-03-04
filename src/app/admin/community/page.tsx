'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { PageCenteredSkeleton } from '@/components/common/skeletons';

/** 게시판: 인기/홍보/자유 */
const BOARD_ITEMS = [
  { href: '/admin/community/popular', label: '인기게시판' },
  { href: '/admin/community/promo', label: '홍보게시판' },
  { href: '/admin/community/free', label: '자유게시판' },
] as const;

/** 내관련글: 내가 쓴 글, 댓글 단 글, 저장한 글 */
const MY_RELATED_ITEMS = [
  { href: '/admin/community/my-posts', label: '내가 쓴 글' },
  { href: '/admin/community/commented', label: '댓글 단 글' },
  { href: '/admin/community/saved', label: '저장한 글' },
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
      {/* 광고 배너: 새로2 가로3 비율, 좌우 여백 */}
      <div className="px-4 pt-4">
        <div
          className="w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
          style={{ aspectRatio: '3/2' }}
        >
          {/* 배너 플레이스홀더 (이미지/광고 연동 시 교체) */}
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
            광고 배너
          </div>
        </div>
      </div>

      {/* 메뉴: 게시판 → 내관련글 순, 섹션별 그룹 */}
      <div className="px-5 py-3">
        {/* 게시판 */}
        <div className="space-y-0.5" aria-label="게시판">
          {BOARD_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex w-full items-center justify-between gap-2 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:text-zinc-600 dark:text-zinc-200 dark:hover:text-zinc-400"
            >
              {label}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* 게시판과 내관련글 사이 간격 */}
        <div className="mt-3" aria-hidden />

        {/* 내관련글 */}
        <div className="space-y-0.5" aria-label="내관련글">
          {MY_RELATED_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex w-full items-center justify-between gap-2 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:text-zinc-600 dark:text-zinc-200 dark:hover:text-zinc-400"
            >
              {label}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
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
