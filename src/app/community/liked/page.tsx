'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { useLikedPosts, useRestoreCommunityListScroll } from '@/features/community/hooks';
import { CommunityListPageSkeleton } from '@/components/common/skeletons';
import { CommunityPostCard } from '@/components/community/community-post-card';
import {
  CommunitySearchFilter,
  type CommunitySort,
} from '@/components/community/community-search-filter';

export default function CommunityLikedPage() {
  const _router = useRouter();
  const { data: _profile, isLoading: profileLoading } = useMyProfile();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CommunitySort>('latest');
  useRestoreCommunityListScroll();

  const likedPosts = useLikedPosts({ sort });
  const filtered = query.trim()
    ? likedPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          (p.content && p.content.toLowerCase().includes(query.toLowerCase()))
      )
    : likedPosts;
  const sorted =
    sort === 'popular'
      ? [...filtered].sort((a, b) => b.likeCount - a.likeCount)
      : [...filtered].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

  if (profileLoading) {
    return <CommunityListPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-zinc-900">
      <CommunitySearchFilter
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        stickyHideOnScroll
        hideFilters
      />

      <div className="space-y-0 px-0 py-4">
        {sorted.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
            {query.trim() ? '검색 결과가 없습니다.' : '좋아요 누른 글이 없습니다.'}
          </p>
        ) : (
          sorted.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              boardHref={`/community/posts/${post.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
