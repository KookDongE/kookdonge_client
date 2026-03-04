'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useLikedPosts } from '@/features/community/hooks';
import { PageCenteredSkeleton } from '@/components/common/skeletons';
import { CommunityPostCard } from '@/components/community/community-post-card';
import {
  CommunitySearchFilter,
  type CommunitySort,
} from '@/components/community/community-search-filter';

export default function CommunityLikedPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CommunitySort>('latest');

  const likedPosts = useLikedPosts();
  const filtered = query.trim()
    ? likedPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.content.toLowerCase().includes(query.toLowerCase())
      )
    : likedPosts;
  const sorted =
    sort === 'popular'
      ? [...filtered].sort((a, b) => b.likeCount - a.likeCount)
      : [...filtered].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

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
      <div className="flex items-center gap-2 px-4 pt-2">
        <Link
          href="/admin/community"
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="뒤로가기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">좋아요 누른 글</h1>
      </div>

      <CommunitySearchFilter
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        stickyHideOnScroll
        className="border-b border-zinc-200 dark:border-zinc-700"
      />

      <div className="space-y-3 px-4 py-4">
        {sorted.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
            {query.trim() ? '검색 결과가 없습니다.' : '좋아요 누른 글이 없습니다.'}
          </p>
        ) : (
          sorted.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              boardHref={`/admin/community/${post.boardType}?id=${post.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
