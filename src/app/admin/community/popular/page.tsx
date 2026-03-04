'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useBoardPosts } from '@/features/community/hooks';
import { PageCenteredSkeleton } from '@/components/common/skeletons';
import { CommunityPostCard } from '@/components/community/community-post-card';
import {
  CommunitySearchFilter,
  type CommunitySort,
} from '@/components/community/community-search-filter';

export default function CommunityPopularPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CommunitySort>('latest');

  const posts = useBoardPosts('popular', query, sort);

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
        {posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
            게시글이 없습니다.
          </p>
        ) : (
          posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              boardHref={`/admin/community/popular?id=${post.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
