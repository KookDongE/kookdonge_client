'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { NotificationRes } from '@/types/api';

const SWIPE_THRESHOLD = 60;
const DELETE_BUTTON_WIDTH = 72;

interface SwipeableNotificationItemProps {
  item: NotificationRes;
  typeLabel: (type: string) => string;
  typeBadgeColor: (type: string) => string;
  formatTime: (iso: string) => string;
  onTap: () => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function SwipeableNotificationItem({
  item,
  typeLabel,
  typeBadgeColor,
  formatTime,
  onTap,
  onDelete,
  isDeleting,
}: SwipeableNotificationItemProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const currentOffset = useRef(0);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
      currentOffset.current = offset;
    },
    [offset]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = startX.current - e.touches[0].clientX;
    const newOffset = Math.min(DELETE_BUTTON_WIDTH, Math.max(0, currentOffset.current + delta));
    setOffset(newOffset);
  }, []);

  const handleTouchEnd = useCallback(() => {
    const current = offset;
    if (current >= SWIPE_THRESHOLD) {
      setOffset(DELETE_BUTTON_WIDTH);
      currentOffset.current = DELETE_BUTTON_WIDTH;
    } else {
      setOffset(0);
      currentOffset.current = 0;
    }
  }, [offset]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const delta = startX.current - e.clientX;
    const newOffset = Math.min(DELETE_BUTTON_WIDTH, Math.max(0, currentOffset.current + delta));
    setOffset(newOffset);
    currentOffset.current = newOffset;
    startX.current = e.clientX;
  }, []);

  const mouseUpHandlerRef = useRef<() => void>(() => {});
  const stableMouseUp = useCallback(() => {
    mouseUpHandlerRef.current();
  }, []);

  const handleMouseUp = useCallback(() => {
    const current = currentOffset.current;
    if (current >= SWIPE_THRESHOLD) {
      setOffset(DELETE_BUTTON_WIDTH);
      currentOffset.current = DELETE_BUTTON_WIDTH;
    } else {
      setOffset(0);
      currentOffset.current = 0;
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stableMouseUp);
  }, [handleMouseMove, stableMouseUp]);

  useEffect(() => {
    mouseUpHandlerRef.current = handleMouseUp;
  }, [handleMouseUp]);

  const startMouseDrag = useCallback(
    (e: React.MouseEvent) => {
      startX.current = e.clientX;
      currentOffset.current = offset;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', stableMouseUp);
    },
    [offset, handleMouseMove, stableMouseUp]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete(item.id);
      setOffset(0);
    },
    [item.id, onDelete]
  );

  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      if (offset > 0) {
        e.preventDefault();
        setOffset(0);
        return;
      }
      onTap();
    },
    [offset, onTap]
  );

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      {/* 삭제 버튼 (스와이프 시 노출) */}
      <div
        className="absolute top-0 right-0 flex h-full w-[72px] items-center justify-center rounded-r-xl bg-red-500"
        style={{ zIndex: 0 }}
      >
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="flex h-full w-full items-center justify-center text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          aria-label="알림 삭제"
        >
          삭제
        </button>
      </div>
      {/* 스와이프되는 카드 */}
      <div
        className="relative z-10 transition-transform duration-0"
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={startMouseDrag}
      >
        <button
          type="button"
          onClick={handleContentClick}
          className={`flex w-full gap-3 rounded-xl border px-4 py-4 text-left transition-colors ${
            item.isRead
              ? 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/50'
              : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1 -ml-1 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeColor(item.type)}`}
              >
                {typeLabel(item.type)}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {formatTime(item.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{item.message}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
