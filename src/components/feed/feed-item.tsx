'use client';

import { useCallback, useRef, useState } from 'react';
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

const SWIPE_THRESHOLD = 50;

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
  }, [imageUrls.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  }, [imageUrls.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) < SWIPE_THRESHOLD) return;
    if (diff > 0) goNext();
    else goPrev();
  }, [goNext, goPrev]);

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

      {/* 미디어 영역: 여러 장이면 스와이프로 넘기기, 한 장이면 단일 */}
      {hasMultiple ? (
        <div
          className="relative aspect-square w-full touch-pan-y select-none overflow-hidden bg-zinc-100 dark:bg-zinc-800"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          {imageUrls.map((url, i) => (
            <div
              key={`${feedId}-${i}`}
              className="absolute inset-0 transition-opacity duration-200"
              style={{
                opacity: i === currentIndex ? 1 : 0,
                pointerEvents: i === currentIndex ? 'auto' : 'none',
              }}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority={i === 0}
                draggable={false}
              />
            </div>
          ))}
          {/* 인디케이터 */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {imageUrls.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-3 bg-white/90'
                    : 'w-1.5 bg-white/50'
                }`}
                aria-hidden
              />
            ))}
          </div>
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
