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
  /** 동아리 ID (관리자일 때 수정/삭제 노출) */
  clubId?: number;
  /** 동아리 관리자 여부 */
  isManager?: boolean;
  /** ... 메뉴(수정/삭제) 노출 여부. 피드 그리드에서는 false */
  showManagerMenu?: boolean;
  onEdit?: (feedId: number) => void;
  onDelete?: (feedId: number) => void;
  isDeleting?: boolean;
};

export function FeedList({
  feeds,
  isLoading,
  clubId,
  isManager,
  showManagerMenu = true,
  onEdit,
  onDelete,
  isDeleting,
}: FeedListProps) {
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
        <FeedItem
          key={feed.feedId}
          {...feed}
          clubId={clubId}
          isManager={isManager}
          showManagerMenu={showManagerMenu}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ))}
    </div>
  );
}
