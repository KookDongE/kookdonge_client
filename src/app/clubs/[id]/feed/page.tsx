'use client';

import { Suspense, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { FeedItemSkeleton } from '@/components/common/skeletons';
import { useMyProfile } from '@/features/auth/hooks';
import { isClubManager } from '@/features/auth/permissions';
import { useClubDetail } from '@/features/club/hooks';
import { useClubFeeds, useDeleteFeed } from '@/features/feed/hooks';
import { FeedList } from '@/components/feed/feed-list';

type PageProps = {
  params: Promise<{ id: string }>;
};

function FeedPageContent({ clubId }: { clubId: number }) {
  const router = useRouter();
  const { data: profile } = useMyProfile();
  const { data: club, isLoading: clubLoading, isError: clubError } = useClubDetail(clubId);
  const { data, isLoading: feedsLoading } = useClubFeeds(clubId);
  const deleteFeed = useDeleteFeed(clubId);
  const isManager = isClubManager(profile, clubId);

  // 없는 동아리 또는 잘못된 id → 홈으로
  useEffect(() => {
    if (Number.isNaN(clubId) || clubId < 1) {
      router.replace('/home');
      return;
    }
    if (clubError || (!clubLoading && !club)) {
      router.replace('/home');
    }
  }, [clubId, clubError, clubLoading, club, router]);

  if (Number.isNaN(clubId) || clubId < 1 || clubError || (!clubLoading && !club)) {
    return (
      <div className="space-y-6 px-2 py-4">
        {[1, 2].map((i) => (
          <FeedItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (clubLoading || feedsLoading) {
    return (
      <div className="space-y-6 px-2 py-4">
        {[1, 2, 3].map((i) => (
          <FeedItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  const feeds = (data?.clubFeedList || []).map((feed) => {
    const imageUrls = feed.postUrls?.length ? feed.postUrls : [];
    return {
      feedId: feed.feedId,
      authorName: club?.name || '동아리',
      authorAvatar: club?.image,
      imageUrls,
      content: feed.content,
      createdAt: feed.createdAt ?? new Date().toISOString(),
    };
  });

  return (
    <>
      {/* 헤더: 뒤로가기 + "~의 피드" */}
      <div className="sticky top-0 z-50 border-b-0 bg-white/95 backdrop-blur-xl dark:bg-zinc-900/95">
        <div className="flex h-16 items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
          </button>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {club?.name || '동아리'}의 피드
          </h1>
        </div>
      </div>

      {/* 피드 리스트 */}
      <div className="pb-32">
        <FeedList
          feeds={feeds}
          isLoading={feedsLoading}
          clubId={clubId}
          isManager={isManager}
          showManagerMenu
          onEdit={(feedId) => router.push(`/mypage/clubs/${clubId}/manage/feed/${feedId}/edit`)}
          onDelete={(feedId) => deleteFeed.mutate(feedId)}
          isDeleting={deleteFeed.isPending}
        />
      </div>
    </>
  );
}

export default function FeedPage({ params }: PageProps) {
  const { id } = use(params);
  const clubId = parseInt(id, 10);

  return (
    <Suspense
      fallback={
        <div className="space-y-6 px-2 py-4">
          {[1, 2, 3].map((i) => (
            <FeedItemSkeleton key={i} />
          ))}
        </div>
      }
    >
      <FeedPageContent clubId={clubId} />
    </Suspense>
  );
}
