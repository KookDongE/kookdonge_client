'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion, useMotionValue, useSpring } from 'framer-motion';

import { clubKeys } from '@/features/club/hooks';

/** 이 거리(px) 이상 드래그해야 당김 시작 */
const DRAG_START_THRESHOLD = 28;
/** 새로고침 발동 임계값 (px) */
const PULL_THRESHOLD = 120;
/** 당김 최대 표시 거리 (px) */
const MAX_PULL = 160;
/** 저항 계수 (쫀득한 느낌) */
const PULL_RESISTANCE = 0.4;
/** 인디케이터 영역 최대 높이 (px) */
const INDICATOR_HEIGHT = 52;

/** 동아리 관리 페이지 진입 시 스크롤 리셋 */
const CLUB_MANAGE_PATH = /^\/mypage\/clubs\/[^/]+\/manage$/;

type PullToRefreshProps = {
  children: React.ReactNode;
  fullScreen?: boolean;
  disabled?: boolean;
  scrollDisabled?: boolean;
};

export function PullToRefresh({
  children,
  fullScreen = false,
  disabled = false,
  scrollDisabled = false,
}: PullToRefreshProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const contentHeight = fullScreen ? '100dvh' : 'calc(100dvh - 3.5rem - 4rem)';

  const y = useMotionValue(0);
  const smoothY = useSpring(y, { damping: 20, stiffness: 150 });

  useLayoutEffect(() => {
    if (!pathname || fullScreen || !CLUB_MANAGE_PATH.test(pathname)) return;
    const el = scrollRef.current;
    if (el) el.scrollTo(0, 0);
    window.scrollTo(0, 0);
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo(0, 0);
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname, fullScreen]);

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    if (pathname) router.replace(pathname, { scroll: false });
    router.refresh();
    if (pathname === '/home') {
      queryClient.invalidateQueries({ queryKey: clubKeys.lists() });
      queryClient.refetchQueries({ queryKey: clubKeys.lists() });
    }
    setTimeout(() => setIsRefreshing(false), 800);
  }, [pathname, router, queryClient]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (fullScreen || disabled) return;
      const el = scrollRef.current;
      if (!el || el.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
    },
    [fullScreen, disabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (fullScreen || disabled) return;
      const el = scrollRef.current;
      if (!el || el.scrollTop > 0 || isRefreshing) return;
      const delta = Math.max(0, e.touches[0].clientY - startYRef.current);
      if (delta < DRAG_START_THRESHOLD) {
        y.set(0);
        setPullDistance(0);
        return;
      }
      const raw = delta - DRAG_START_THRESHOLD;
      const distance = Math.min(MAX_PULL, raw * PULL_RESISTANCE);
      y.set(distance);
      setPullDistance(distance);
    },
    [fullScreen, disabled, isRefreshing, y]
  );

  const onTouchEnd = useCallback(() => {
    if (fullScreen || disabled) return;
    const currentY = y.get();
    if (currentY >= PULL_THRESHOLD - 10 && !isRefreshing) {
      triggerRefresh();
    }
    setPullDistance(0);
    y.set(0);
  }, [fullScreen, disabled, isRefreshing, y, triggerRefresh]);

  const canPull = !fullScreen && !disabled;

  return (
    <div
      ref={scrollRef}
      data-scroll-container
      className={`pb-safe h-full overscroll-y-none ${fullScreen || scrollDisabled ? 'no-scrollbar overflow-hidden' : 'overflow-y-auto'}`}
      style={{ height: contentHeight }}
      onTouchStart={canPull ? onTouchStart : undefined}
      onTouchMove={canPull ? onTouchMove : undefined}
      onTouchEnd={canPull ? onTouchEnd : undefined}
      onTouchCancel={canPull ? onTouchEnd : undefined}
    >
      <motion.div className="min-h-full" style={{ y: smoothY }}>
        {/* 인디케이터: 당길 때/새로고침 중에만 높이 있음 (예전 UI) */}
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            minHeight: isRefreshing ? INDICATOR_HEIGHT : Math.min(INDICATOR_HEIGHT, pullDistance),
          }}
        >
          {pullDistance > 0 || isRefreshing ? (
            isRefreshing ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-lime-400" />
            ) : (
              <span
                className="text-xs text-zinc-500 dark:text-zinc-400"
                style={{ opacity: Math.min(1, pullDistance / 36) }}
              >
                {pullDistance >= PULL_THRESHOLD ? '놓아서 새로고침' : '당겨서 새로고침'}
              </span>
            )
          ) : null}
        </div>
        {children}
      </motion.div>
    </div>
  );
}
