'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/** 새로고침이 발동되려면 당겨야 하는 최소 거리 (px). 높을수록 둔감 */
const PULL_THRESHOLD = 95;
/** 당김 감도. 낮을수록 부드럽고 둔감 (0.3~0.4 권장) */
const PULL_DAMPING = 0.35;
/** 당김 최대 표시 거리 (px). THRESHOLD보다 커야 새로고침 발동 가능 */
const MAX_PULL = 130;
/** 손가락 놓았을 때 원위치로 돌아가는 애니메이션 시간 (ms) */
const RELEASE_DURATION_MS = 320;

/** 동아리 관리 페이지 진입 시 스크롤 리셋 (캐시된 페이지 재진입 시에도 동작) */
const CLUB_MANAGE_PATH = /^\/mypage\/clubs\/[^/]+\/manage$/;

type PullToRefreshProps = {
  children: React.ReactNode;
  /** true면 헤더/하단네비 없는 풀스크린(스플래시·로그인) — 높이 100dvh */
  fullScreen?: boolean;
  /** true면 당겨서 새로고침 비활성화 (예: 피드 상세) */
  disabled?: boolean;
};

export function PullToRefresh({
  children,
  fullScreen = false,
  disabled = false,
}: PullToRefreshProps) {
  const pathname = usePathname();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const lastDistanceRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  /** 놓을 때만 트랜지션 적용 — 당기는 중에는 트랜지션 없이 손가락을 따라감 */
  const [isReleasing, setIsReleasing] = useState(false);

  const contentHeight = fullScreen ? '100dvh' : 'calc(100dvh - 3.5rem - 4rem)';

  // 동아리 관리 페이지로 진입할 때마다 스크롤 맨 위로 (캐시 재진입 시에도 PullToRefresh는 pathname 갱신을 받음)
  // 한 프레임 뒤 한 번 더 실행해 스크롤 복원(restoration)을 덮어씀
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

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (fullScreen || disabled) return;
      const el = scrollRef.current;
      if (!el || el.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
      setIsReleasing(false);
    },
    [fullScreen, disabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (fullScreen || disabled) return;
      const el = scrollRef.current;
      if (!el || el.scrollTop > 0 || isRefreshing) return;
      const y = e.touches[0].clientY;
      const delta = Math.max(0, y - startYRef.current);
      const distance = Math.min(delta * PULL_DAMPING, MAX_PULL);
      lastDistanceRef.current = distance;
      setPullDistance(distance);
    },
    [fullScreen, disabled, isRefreshing]
  );

  const onTouchEnd = useCallback(() => {
    if (fullScreen || disabled) return;
    const distance = lastDistanceRef.current;
    if (distance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setIsReleasing(true);
      setPullDistance(0);
      if (pathname) {
        router.replace(pathname, { scroll: false });
      }
      router.refresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setIsReleasing(false);
      }, 800);
    } else {
      setIsReleasing(true);
      setPullDistance(0);
      setTimeout(() => setIsReleasing(false), RELEASE_DURATION_MS);
    }
  }, [fullScreen, disabled, pathname, isRefreshing, router]);

  return (
    <div
      ref={scrollRef}
      data-scroll-container
      className={`pb-safe h-full overscroll-y-none ${fullScreen ? 'no-scrollbar overflow-hidden' : 'overflow-y-auto'}`}
      style={{ height: contentHeight }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className={isReleasing ? 'transition-transform ease-out' : ''}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transitionDuration: isReleasing ? `${RELEASE_DURATION_MS}ms` : undefined,
          willChange: pullDistance > 0 || isRefreshing ? 'transform' : undefined,
        }}
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
