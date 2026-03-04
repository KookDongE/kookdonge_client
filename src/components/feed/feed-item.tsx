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
  /** 동아리 관리자일 때 수정/삭제 노출 */
  clubId?: number;
  isManager?: boolean;
  /** ... 메뉴(수정/삭제) 노출 여부. 피드 그리드/리스트에서는 false로 숨김 */
  showManagerMenu?: boolean;
  onEdit?: (feedId: number) => void;
  onDelete?: (feedId: number) => void;
  isDeleting?: boolean;
};

const SWIPE_THRESHOLD = 50;
/** 이 길이를 넘으면 더보기/접기 노출 (인스타 스타일) */
const CONTENT_MORE_THRESHOLD = 100;

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
  clubId,
  isManager,
  showManagerMenu = true,
  onEdit,
  onDelete,
  isDeleting,
}: FeedItemProps) {
  const hasMultiple = imageUrls.length > 1;
  const hasNoImage = imageUrls.length === 0 || !imageUrls[0]?.trim();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);
  /** 로드 실패한 이미지 인덱스 → 회색 배경으로 대체 */
  const [failedImageIndices, setFailedImageIndices] = useState<Set<number>>(new Set());
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleImageError = useCallback((index: number) => {
    setFailedImageIndices((prev) => new Set(prev).add(index));
  }, []);

  const showMoreToggle =
    content.length > CONTENT_MORE_THRESHOLD ||
    (content.includes('\n') && content.split('\n').length > 3);
  const isContentCollapsed = showMoreToggle && !contentExpanded;

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
    <article
      id={`feed-${feedId}`}
      className="scroll-mt-16 mb-8 border-b border-zinc-200 bg-white pb-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* 헤더 영역: 프로필 사진 + (이름 + 작성 시간 세로) + 더보기 메뉴 */}
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
                unoptimized
              />
            ) : (
              <DefaultClubImage className="rounded-full object-cover" sizes="40px" />
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {authorName}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {formatTimeAgo(createdAt)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {showManagerMenu && isManager && clubId != null && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((p) => !p)}
                className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                aria-label="더보기"
                aria-expanded={menuOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="6" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="18" r="1.5" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 z-50 mt-1 min-w-[100px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit(feedId);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        수정
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          if (confirm('이 피드를 삭제할까요?')) onDelete(feedId);
                        }}
                        disabled={isDeleting}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        {isDeleting ? '삭제 중...' : '삭제'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 미디어 영역: 이미지 없음 → 회색, 여러 장 → 스와이프, 한 장 → 단일 */}
      {hasNoImage ? (
        <div className="relative aspect-square w-full bg-zinc-200 dark:bg-zinc-700" />
      ) : hasMultiple ? (
        <div
          className="relative aspect-square w-full touch-pan-y overflow-hidden bg-zinc-100 select-none dark:bg-zinc-800"
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
              {failedImageIndices.has(i) ? (
                <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700" />
              ) : (
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={i === 0}
                  draggable={false}
                  onError={() => handleImageError(i)}
                />
              )}
            </div>
          ))}
          {/* 인디케이터: 클릭 시 해당 사진으로 이동 */}
          <div className="absolute right-0 bottom-2 left-0 flex justify-center gap-1.5">
            {imageUrls.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? 'w-3 bg-white/90' : 'w-1.5 bg-white/50'
                } hover:bg-white/80 focus:ring-2 focus:ring-white/50 focus:ring-offset-1 focus:ring-offset-transparent focus:outline-none`}
                aria-label={`${i + 1}번째 사진으로 이동`}
                aria-current={i === currentIndex ? 'true' : undefined}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative aspect-square w-full bg-zinc-200 dark:bg-zinc-700">
          {failedImageIndices.has(0) ? (
            <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700" />
          ) : (
            <Image
              src={imageUrls[0] ?? ''}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
              onError={() => handleImageError(0)}
            />
          )}
        </div>
      )}

      {/* 정보 영역: 본문글 (줄바꿈 유지) + 더보기/접기 */}
      <div className="px-4 pt-2">
        <p
          className={`text-sm whitespace-pre-wrap text-zinc-900 dark:text-zinc-100 ${
            isContentCollapsed ? 'line-clamp-3' : ''
          }`}
        >
          <span className="font-semibold">{authorName}</span>{' '}
          <span className="text-zinc-700 dark:text-zinc-300">{content}</span>
        </p>
        {showMoreToggle && (
          <button
            type="button"
            onClick={() => setContentExpanded((prev) => !prev)}
            className="mt-0.5 text-left text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            aria-expanded={contentExpanded}
          >
            {contentExpanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
    </article>
  );
}
