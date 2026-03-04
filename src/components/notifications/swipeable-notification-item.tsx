'use client';

import { useEffect, useRef, useState } from 'react';

import { motion } from 'framer-motion';

import type { NotificationRes } from '@/types/api';

const SWIPE_THRESHOLD = -80;
const ACTION_WIDTH = 72;

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [isSwiped, setIsSwiped] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartTimeRef = useRef<number | null>(null);

  const handleDragStart = () => {
    dragStartTimeRef.current = Date.now();
    setHasDragged(false);
  };

  const handleDrag = (_event: unknown, info: { offset: { x: number } }) => {
    const currentX = info.offset.x;
    setIsSwiped(currentX < SWIPE_THRESHOLD);
    setDragX(currentX);
    if (Math.abs(info.offset.x) > 10) {
      setHasDragged(true);
    }
  };

  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    const currentX = info.offset.x;
    if (currentX < SWIPE_THRESHOLD) {
      setDragX(-ACTION_WIDTH);
      setIsSwiped(true);
    } else {
      setDragX(0);
      setIsSwiped(false);
    }
    setTimeout(() => {
      setHasDragged(false);
      dragStartTimeRef.current = null;
    }, 150);
  };

  const resetSwipe = () => {
    setDragX(0);
    setIsSwiped(false);
  };

  useEffect(() => {
    if (!isSwiped) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const wrapper = wrapperRef.current;
      const isButton = (e.target as HTMLElement).closest?.('[data-swipe-button]');
      if (wrapper && !wrapper.contains(target) && !isButton) {
        resetSwipe();
      }
    };
    const handleScroll = () => resetSwipe();
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isSwiped]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSwiped) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (dragStartTimeRef.current && Date.now() - dragStartTimeRef.current < 200) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onTap();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(item.id);
    resetSwipe();
  };

  return (
    <div ref={wrapperRef} className="relative overflow-hidden rounded-xl">
      {/* 카드 영역: 스와이프 시 너비를 줄여 우측에 삭제 버튼이 보이도록 */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick(e as unknown as React.MouseEvent);
          }
        }}
        className="relative z-0 cursor-pointer transition-[width] duration-150 ease-out"
        style={{ width: isSwiped ? `calc(100% - ${ACTION_WIDTH}px)` : '100%' }}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{ x: dragX }}
          animate={{ x: dragX }}
          transition={{ type: 'tween', duration: 0.2 }}
          className={`flex w-full touch-none gap-3 rounded-xl border px-4 py-4 text-left ${
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
        </motion.div>
      </div>

      {/* 삭제 버튼: 스와이프했을 때만 보임 (홈 동아리 카드와 동일 패턴) */}
      <div
        className={`absolute top-0 right-0 z-10 flex h-full items-center justify-center transition-opacity duration-150 ${
          isSwiped ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ width: ACTION_WIDTH }}
      >
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={!isSwiped || isDeleting}
          data-swipe-button
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-red-100 px-2.5 py-1.5 text-red-600 transition-colors hover:bg-red-200 disabled:pointer-events-none disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
          aria-label="알림 삭제"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4 shrink-0"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span className="text-[10px] font-medium">삭제</span>
        </button>
      </div>
    </div>
  );
}
