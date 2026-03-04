'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { PageCenteredSkeleton } from '@/components/common/skeletons';

/** 게시판: 인기/홍보/자유 */
const BOARD_ITEMS = [
  { href: '/admin/community/popular', label: '인기게시판', icon: 'fire' },
  { href: '/admin/community/promo', label: '홍보게시판', icon: 'megaphone' },
  { href: '/admin/community/free', label: '자유게시판', icon: 'chat' },
] as const;

/** 내관련글: 내가 쓴 글, 댓글 단 글, 저장한 글 */
const MY_RELATED_ITEMS = [
  { href: '/admin/community/my-posts', label: '내가 쓴 글', icon: 'document' },
  { href: '/admin/community/commented', label: '댓글 단 글', icon: 'chat' },
  { href: '/admin/community/saved', label: '저장한 글', icon: 'bookmark' },
] as const;

function MenuIcon({ type }: { type: string }) {
  const cls = 'h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400';
  switch (type) {
    case 'fire':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cls}
        >
          <path
            fillRule="evenodd"
            d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177A7.547 7.547 0 0 1 8 9.5a7.547 7.547 0 0 1 0-1.5 9.742 9.742 0 0 0 3.539-6.177.75.75 0 0 0 1.07.136 8.963 8.963 0 0 1 3.394 6.17 8.963 8.963 0 0 1-3.394 6.17Z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'megaphone':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cls}
        >
          <path d="M18.448 2.132c.654-.39 1.354.197 1.354.945v17.846c0 .748-.7 1.335-1.354.945a42.158 42.158 0 0 1-5.448-5.174 1.2 1.2 0 0 0-.698-.347l-4.878-.815a1.2 1.2 0 0 1-.732-.366L2.654 12.8a1.2 1.2 0 0 1 0-1.6l2.498-2.498a1.2 1.2 0 0 1 .732-.366l4.878-.815a1.2 1.2 0 0 0 .698-.347 42.158 42.158 0 0 1 5.448-5.174Z" />
        </svg>
      );
    case 'chat':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cls}
        >
          <path
            fillRule="evenodd"
            d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.643 0 5.049.166 7.152.468a48.62 48.62 0 0 1 3.897 1.618 1.5 1.5 0 0 1-.75 2.766 47.078 47.078 0 0 0-3.55-1.44 47.514 47.514 0 0 0-6.597 0 47.078 47.078 0 0 0-3.55 1.44 1.5 1.5 0 0 1-.75-2.766 48.62 48.62 0 0 1 3.897-1.618ZM12 3.75a45.562 45.562 0 0 0-6.75.75 1.5 1.5 0 0 1-.75 2.77 47.078 47.078 0 0 0-3.55 1.44 1.5 1.5 0 0 1-.75-2.766 48.62 48.62 0 0 1 3.897-1.618A47.575 47.575 0 0 1 12 3.75ZM6.75 9a.75.75 0 0 1 .75.75v.016a3.375 3.375 0 1 0 6.75 0V9.75A.75.75 0 0 1 15 9h.75a.75.75 0 0 1 .75.75v.016a4.875 4.875 0 0 1-9.75 0V9.75A.75.75 0 0 1 9 9h-.75Z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'document':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cls}
        >
          <path
            fillRule="evenodd"
            d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'bookmark':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cls}
        >
          <path
            fillRule="evenodd"
            d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return null;
  }
}

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
      {/* 광고 배너: 새로2 가로3 비율, 좌우 여백, 하단 마진 */}
      <div className="mb-4 px-4 pt-4">
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
          {BOARD_ITEMS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:text-zinc-600 dark:text-zinc-200 dark:hover:text-zinc-400"
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <MenuIcon type={icon} />
                {label}
              </span>
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
          {MY_RELATED_ITEMS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:text-zinc-600 dark:text-zinc-200 dark:hover:text-zinc-400"
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <MenuIcon type={icon} />
                {label}
              </span>
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
