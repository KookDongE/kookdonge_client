'use client';

import { Suspense, use } from 'react';
import { useRouter } from 'next/navigation';

import { Spinner } from '@heroui/react';

import { useClubDetail } from '@/features/club/hooks';
import { useClubFeeds } from '@/features/feed/hooks';
import { FeedList } from '@/components/feed/feed-list';

type PageProps = {
  params: Promise<{ id: string }>;
};

function FeedPageContent({ clubId }: { clubId: number }) {
  const router = useRouter();
  const { data: club, isLoading: clubLoading } = useClubDetail(clubId);
  const { data, isLoading: feedsLoading } = useClubFeeds(clubId);

  if (clubLoading || feedsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const feeds = (data?.clubFeedList || []).map((feed, index) => {
    const now = new Date();
    const createdAt = new Date(now.getTime() - (index + 1) * 2 * 60 * 60 * 1000).toISOString();

    return {
      feedId: feed.feedId,
      authorName: club?.name || '동아리',
      authorAvatar: club?.image,
      imageUrl: feed.postUrls[0] || 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800',
      content: feed.content,
      createdAt,
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
        <FeedList feeds={feeds} isLoading={feedsLoading} />
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
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <FeedPageContent clubId={clubId} />
    </Suspense>
  );
}
