'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useBoardPosts } from '@/features/community/hooks';
import { CommunityListPageSkeleton } from '@/components/common/skeletons';
import { CommunityPostCard } from '@/components/community/community-post-card';
import {
  CommunitySearchFilter,
  type CommunitySort,
} from '@/components/community/community-search-filter';
export default function CommunityPromoPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [sort, setSort] = useState<CommunitySort>('latest');

  const posts = useBoardPosts('promo', '', sort);

  const handleSearchSubmit = (q: string) => {
    if (!q.trim()) {
      router.push('/community/search');
      return;
    }
    const params = new URLSearchParams({ q: q.trim(), category: 'PROMOTION' });
    router.push(`/community/search?${params.toString()}`);
  };

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  if (profileLoading || (profile && !isSystemAdmin(profile))) {
    return <CommunityListPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-zinc-900">
      <CommunitySearchFilter
        query=""
        onQueryChange={handleSearchSubmit}
        sort={sort}
        onSortChange={setSort}
        stickyHideOnScroll
        hideFilters
        submitOnly
      />

      <div className="space-y-0 px-0 py-4">
        {posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
            게시글이 없습니다.
          </p>
        ) : (
          posts.map((post) => (
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
