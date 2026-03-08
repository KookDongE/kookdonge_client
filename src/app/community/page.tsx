'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { CommunityHomeSkeleton } from '@/components/common/skeletons';
import { CommunityBannerCarousel } from '@/components/community/community-banner-carousel';
import { CommunitySearchInputRow } from '@/components/community/community-search-filter';

/** 게시판: 인기/홍보/자유 */
const BOARD_ITEMS = [
  { href: '/community/popular', label: '인기게시판', icon: 'fire' },
  { href: '/community/promo', label: '홍보게시판', icon: 'megaphone' },
  { href: '/community/free', label: '자유게시판', icon: 'chat' },
] as const;

/** 내관련글: 내가 쓴 글, 댓글 단 글, 저장한 글 */
const MY_RELATED_ITEMS = [
  { href: '/community/my-posts', label: '내가 쓴 글', icon: 'user' },
  { href: '/community/commented', label: '댓글 단 글', icon: 'comment' },
  { href: '/community/saved', label: '저장한 글', icon: 'bookmark' },
] as const;

function MenuIcon({ type }: { type: string }) {
  const cls = 'h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400';
  switch (type) {
    case 'fire':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 160 160"
          fill="currentColor"
          className={cls}
        >
          <path d="M41.1087 61.9L41.0887 61.93L41.0387 61.99L40.8887 62.19L40.3687 62.9C39.9287 63.5067 39.3653 64.36 38.6787 65.46C36.8749 68.4079 35.3291 71.506 34.0587 74.72C30.9587 82.52 28.4587 93.57 31.2487 106.09C33.8887 117.99 38.9887 129.03 47.8287 137.13C56.7487 145.29 68.9987 150 85.0387 150C101.209 150 113.879 144.57 122.469 135.27C130.989 126.03 135.039 113.47 135.039 100C135.039 91.41 132.179 83.11 128.339 75.36C124.689 67.98 119.949 60.72 115.499 53.89L114.839 52.89C110.109 45.64 105.809 38.94 102.939 32.56C100.089 26.19 98.9687 20.76 99.9287 15.98C100.074 15.2549 100.056 14.5067 99.8768 13.7892C99.6978 13.0718 99.3618 12.403 98.8931 11.831C98.4245 11.259 97.8348 10.7981 97.1665 10.4815C96.4983 10.1649 95.7681 10.0004 95.0287 10C90.8087 10 83.7687 11.48 77.0987 14.93C70.3687 18.42 63.3387 24.26 60.2787 33.42C56.3787 45.12 60.8787 58.32 64.7087 66.65C66.4187 70.35 64.9387 74.45 62.1087 75.87C61.4729 76.1909 60.7799 76.3828 60.0696 76.4348C59.3594 76.4868 58.6458 76.3977 57.9701 76.1728C57.2944 75.9478 56.6698 75.5915 56.1324 75.1242C55.595 74.6569 55.1553 74.0879 54.8387 73.45L49.4987 62.76C49.1226 62.0079 48.5629 61.3628 47.8713 60.8844C47.1798 60.406 46.3788 60.1097 45.5424 60.023C44.706 59.9363 43.8612 60.0619 43.0862 60.3882C42.3112 60.7146 41.6311 61.2411 41.1087 61.9Z" />
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
          viewBox="0 0 240 240"
          fill="currentColor"
          className={cls}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M183.493 20C191.303 20 199.063 24.7 201.743 33.05L202.503 35.51L203.293 38.31L204.093 41.47L204.863 44.93L205.593 48.69L205.933 50.67L206.543 54.84C208.843 72.74 208.113 97.14 195.323 121.89L193.733 124.86C180.313 149.01 181.283 173.32 184.313 189.11L185.053 192.6L185.433 194.22L186.203 197.22L186.973 199.84C189.713 208.74 183.793 219.06 173.703 219.94L172.303 220H56.4928C48.6928 220 40.9228 215.3 38.2428 206.95L37.4928 204.49L36.6928 201.69L35.8928 198.53L35.1228 195.07L34.3928 191.31C34.1528 190.01 33.9328 188.667 33.7328 187.28L33.1828 182.98L32.7628 178.44C31.4928 161.4 33.4128 139.89 44.6628 118.11L46.2528 115.14C59.6728 91 58.6928 66.68 55.6728 50.9L54.9428 47.41L54.5528 45.79L53.7828 42.79L53.0128 40.17C50.2728 31.27 56.1928 20.95 66.2828 20.07L67.6928 20H183.493ZM119.993 120H89.9928C87.3407 120 84.7971 121.054 82.9218 122.929C81.0464 124.804 79.9928 127.348 79.9928 130C79.9928 132.652 81.0464 135.196 82.9218 137.071C84.7971 138.946 87.3407 140 89.9928 140H119.993C122.645 140 125.189 138.946 127.064 137.071C128.939 135.196 129.993 132.652 129.993 130C129.993 127.348 128.939 124.804 127.064 122.929C125.189 121.054 122.645 120 119.993 120ZM159.993 80H99.9928C97.4441 80.0028 94.9925 80.9788 93.1392 82.7285C91.2858 84.4782 90.1705 86.8695 90.0211 89.4139C89.8718 91.9584 90.6996 94.4638 92.3355 96.4183C93.9714 98.3729 96.2919 99.629 98.8229 99.93L99.9928 100H159.993C162.542 99.9972 164.993 99.0212 166.847 97.2715C168.7 95.5218 169.815 93.1305 169.965 90.5861C170.114 88.0416 169.286 85.5362 167.65 83.5817C166.014 81.6271 163.694 80.371 161.163 80.07L159.993 80Z"
          />
        </svg>
      );
    case 'comment':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cls}
        >
          <path
            fillRule="evenodd"
            d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            clipRule="evenodd"
          />
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
  const [searchInput, setSearchInput] = useState('');
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  const handleSearchSubmit = () => {
    const q = searchInput.trim();
    if (q) {
      router.push(`/community/search?q=${encodeURIComponent(q)}`);
    }
  };

  if (profileLoading) {
    return <CommunityHomeSkeleton />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white pb-20 dark:bg-zinc-900">
      {/* 상단 검색: 오른쪽 돋보기 버튼 */}
      <div className="px-4 py-3">
        <CommunitySearchInputRow
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleSearchSubmit}
          placeholder="게시글 검색"
        />
      </div>

      {/* 광고 배너: 가로2 세로1 비율 캐러셀, 3초 자동 전환, 인디케이터 점 */}
      <div className="mb-4 px-4 pt-4">
        <div
          className="w-full overflow-hidden"
          style={{ aspectRatio: '2/1' }}
        >
          <CommunityBannerCarousel />
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
        <div className="mt-5" aria-hidden />

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
