'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useSearchPosts } from '@/features/community/hooks';
import type { CommunityPostCategory } from '@/types/api';
import { CommunityListPageSkeleton } from '@/components/common/skeletons';
import { CommunityPostCard } from '@/components/community/community-post-card';
import {
  CommunitySearchFilter,
  type CommunitySort,
} from '@/components/community/community-search-filter';

const CATEGORY_VALUES = ['FREE', 'PROMOTION'] as const;
function parseCategory(value: string | null): CommunityPostCategory | undefined {
  if (value === 'FREE' || value === 'PROMOTION') return value;
  return undefined;
}

export default function CommunitySearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const q = searchParams.get('q') ?? '';
  const category = parseCategory(searchParams.get('category'));
  const [query, setQuery] = useState(q);
  const [sort, setSort] = useState<CommunitySort>('latest');

  const posts = useSearchPosts(query, sort, category);
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  useEffect(() => {
    const next = searchParams.get('q') ?? '';
    startTransition(() => setQuery(next));
  }, [searchParams]);

  const handleQueryChange = (v: string) => {
    setQuery(v);
    const params = new URLSearchParams(searchParams.toString());
    if (v.trim()) params.set('q', v.trim());
    else params.delete('q');
    if (category && CATEGORY_VALUES.includes(category)) params.set('category', category);
    router.replace(params.toString() ? `?${params.toString()}` : '/community/search', {
      scroll: false,
    });
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
        query={query}
        onQueryChange={handleQueryChange}
        sort={sort}
        onSortChange={setSort}
        stickyHideOnScroll
        hideFilters
      />
      <div className="px-0 py-4">
        {!query.trim() ? (
          <p className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
            검색어를 입력해 주세요.
          </p>
        ) : isPending ? (
          <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
            검색 중...
          </div>
        ) : posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
            &quot;{query}&quot;에 대한 검색 결과가 없습니다.
          </p>
        ) : (
          <div className="space-y-0">
            {posts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                boardHref={`/community/posts/${post.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
