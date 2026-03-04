'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useSavedPosts } from '@/features/community/hooks';
import { PageCenteredSkeleton } from '@/components/common/skeletons';
import { CommunityPostCard } from '@/components/community/community-post-card';
import {
  CommunitySearchFilter,
  type CommunitySort,
} from '@/components/community/community-search-filter';

export default function CommunitySavedPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CommunitySort>('latest');

  const savedPosts = useSavedPosts();
  const filtered = query.trim()
    ? savedPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.content.toLowerCase().includes(query.toLowerCase())
      )
    : savedPosts;
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
      <CommunitySearchFilter
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        stickyHideOnScroll
        hideFilters
        className="border-b border-zinc-200 dark:border-zinc-700"
      />

      <div className="space-y-3 px-4 py-4">
        {sorted.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
            {query.trim() ? '검색 결과가 없습니다.' : '저장 누른 글이 없습니다.'}
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
