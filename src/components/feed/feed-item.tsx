'use client';

import Image from 'next/image';

import { DefaultClubImage } from '@/components/common/default-club-image';

type FeedItemProps = {
  feedId: number;
  authorName: string;
  authorAvatar?: string;
  /** 피드 이미지 URL 목록 (여러 장 표시) */
  imageUrls: string[];
  content: string;
  createdAt: string;
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function FeedItem({
  feedId,
  authorName,
  authorAvatar,
  imageUrls,
  content,
  createdAt,
}: FeedItemProps) {
  const hasMultiple = imageUrls.length > 1;

  return (
    <article className="mb-8 border-b border-zinc-200 bg-white pb-6 dark:border-zinc-800 dark:bg-zinc-900">
      {/* 헤더 영역: 프로필 사진 + 이름 + 작성 시간 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <DefaultClubImage className="rounded-full object-cover" sizes="40px" />
            )}
          </div>
          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {authorName}
          </span>
        </div>
        <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
          {formatTimeAgo(createdAt)}
        </span>
      </div>

      {/* 미디어 영역: 여러 장이면 가로 스크롤, 한 장이면 단일 비율 */}
      {hasMultiple ? (
        <div className="flex gap-1 overflow-x-auto px-0 py-0 scrollbar-thin">
          {imageUrls.map((url, i) => (
            <div
              key={`${feedId}-${i}`}
              className="relative shrink-0 basis-[85%] overflow-hidden rounded-none bg-zinc-100 dark:bg-zinc-800"
              style={{ aspectRatio: '1' }}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 480px) 85vw, 400px"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={imageUrls[0] ?? ''}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* 정보 영역: 본문글 */}
      <div className="px-4 pt-2">
        <p className="text-sm text-zinc-900 dark:text-zinc-100">
          <span className="font-semibold">{authorName}</span>{' '}
          <span className="text-zinc-700 dark:text-zinc-300">{content}</span>
        </p>
      </div>
    </article>
  );
}
