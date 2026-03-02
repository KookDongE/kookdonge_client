'use client';

import { Spinner } from '@heroui/react';

import { FeedItem } from './feed-item';

export type FeedData = {
  feedId: number;
  authorName: string;
  authorAvatar?: string;
  /** 피드 이미지 URL 목록 (여러 장) */
  imageUrls: string[];
  content: string;
  createdAt: string;
};

type FeedListProps = {
  feeds: FeedData[];
  isLoading?: boolean;
};

export function FeedList({ feeds, isLoading }: FeedListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (feeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500">
        <p>아직 피드가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {feeds.map((feed) => (
        <FeedItem key={feed.feedId} {...feed} />
      ))}
    </div>
  );
}
