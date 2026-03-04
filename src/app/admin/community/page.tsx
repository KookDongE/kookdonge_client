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
  { href: '/admin/community/my-posts', label: '내가 쓴 글', icon: 'user' },
  { href: '/admin/community/commented', label: '댓글 단 글', icon: 'comment' },
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
            d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.643 8.07c.635.193.1.313.456.313.313 0 .694-.088.912-.126.218-.038.352-.048.352-.048s.174.01.392.048c.218.037.599.126.912.126.313 0 .821-.12.456-.313a8.252 8.252 0 01-2.638-15.786z"
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
          <path d="M18.448 2.132c.654-.39 1.354.197 1.354.945v17.846c0 .748-.7 1.335-1.354.945a42.158 42.158 0 01-5.448-5.174 1.2 1.2 0 00-.698-.347l-4.878-.815a1.2 1.2 0 01-.732-.366L2.654 12.8a1.2 1.2 0 010-1.6l2.498-2.498a1.2 1.2 0 01.732-.366l4.878-.815a1.2 1.2 0 00.698-.347 42.158 42.158 0 015.448-5.174z" />
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
            d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.643 0 5.049.166 7.152.468a48.62 48.62 0 013.897 1.618 1.5 1.5 0 01-.75 2.766 47.078 47.078 0 00-3.55-1.44 47.514 47.514 0 00-6.597 0 47.078 47.078 0 00-3.55 1.44 1.5 1.5 0 01-.75-2.766 48.62 48.62 0 013.897-1.618zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'comment':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      );
    case 'user':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cls}
        >
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
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
        <div className="mb-3 space-y-0.5" aria-label="게시판">
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
