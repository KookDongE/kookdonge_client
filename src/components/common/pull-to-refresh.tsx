'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const PULL_THRESHOLD = 60;
const MAX_PULL = 80;

type PullToRefreshProps = {
  children: React.ReactNode;
  /** true면 헤더/하단네비 없는 풀스크린(스플래시·로그인) — 높이 100dvh */
  fullScreen?: boolean;
};

export function PullToRefresh({ children, fullScreen = false }: PullToRefreshProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const contentHeight = fullScreen ? '100dvh' : 'calc(100dvh - 3.5rem - 4rem)';

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) return;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const el = scrollRef.current;
      if (!el || el.scrollTop > 0 || isRefreshing) return;
      const y = e.touches[0].clientY;
      const delta = Math.max(0, y - startYRef.current);
      const distance = Math.min(delta * 0.5, MAX_PULL);
      setPullDistance(distance);
    },
    [isRefreshing]
  );

  const onTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);
      router.refresh();
      setTimeout(() => setIsRefreshing(false), 800);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, router]);

  return (
    <div
      ref={scrollRef}
      className="pb-safe h-full overflow-y-auto overscroll-y-none"
      style={{ height: contentHeight }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="transition-transform duration-150"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        <div
          className="flex items-center justify-center"
          style={{ minHeight: pullDistance > 0 || isRefreshing ? 52 : 0 }}
        >
          {pullDistance > 0 || isRefreshing ? (
            isRefreshing ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-lime-400" />
            ) : (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {pullDistance >= PULL_THRESHOLD ? '놓아서 새로고침' : '당겨서 새로고침'}
              </span>
            )
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
