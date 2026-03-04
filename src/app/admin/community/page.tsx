'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useCommunitySections } from '@/features/community/hooks';
import { PageCenteredSkeleton } from '@/components/common/skeletons';
import { CommunityPostCard } from '@/components/community/community-post-card';
import {
  CommunitySearchFilter,
  type CommunitySort,
} from '@/components/community/community-search-filter';

const SECTION_TITLES = {
  popular: '인기글',
  promo: '홍보글',
  free: '자유게시판',
} as const;

const BOARD_HREFS = {
  popular: '/admin/community/popular',
  promo: '/admin/community/promo',
  free: '/admin/community/free',
} as const;

export default function AdminCommunityPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CommunitySort>('latest');

  const { popular, promo, free } = useCommunitySections(query, sort);

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
    <div className="min-h-screen bg-[var(--background)] pb-20">
      {/* 상단: 헤더는 AppShell에서 제공. 여기서는 제목 + 검색 + 필터 */}
      <div className="px-4 pt-2">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">커뮤니티</h1>
      </div>

      <CommunitySearchFilter
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        stickyHideOnScroll
        className="border-b border-zinc-200 dark:border-zinc-700"
      />

      {/* 인기글, 홍보글, 자유게시판 순서대로 각 최대 5개 */}
      <div className="space-y-8 px-4 py-4">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {SECTION_TITLES.popular}
            </h2>
            <Link href={BOARD_HREFS.popular} className="text-sm text-blue-500 dark:text-lime-400">
              더보기
            </Link>
          </div>
          <div className="space-y-3">
            {popular.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
                게시글이 없습니다.
              </p>
            ) : (
              popular.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  boardHref={`${BOARD_HREFS.popular}?id=${post.id}`}
                />
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {SECTION_TITLES.promo}
            </h2>
            <Link href={BOARD_HREFS.promo} className="text-sm text-blue-500 dark:text-lime-400">
              더보기
            </Link>
          </div>
          <div className="space-y-3">
            {promo.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
                게시글이 없습니다.
              </p>
            ) : (
              promo.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  boardHref={`${BOARD_HREFS.promo}?id=${post.id}`}
                />
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {SECTION_TITLES.free}
            </h2>
            <Link href={BOARD_HREFS.free} className="text-sm text-blue-500 dark:text-lime-400">
              더보기
            </Link>
          </div>
          <div className="space-y-3">
            {free.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
                게시글이 없습니다.
              </p>
            ) : (
              free.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  boardHref={`${BOARD_HREFS.free}?id=${post.id}`}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
