'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion, useMotionValue, useSpring } from 'framer-motion';

import { clubKeys } from '@/features/club/hooks';

/** 이 거리(px) 이상 드래그해야 당김 시작 */
const DRAG_START_THRESHOLD = 20;
/** 새로고침 발동 임계값 (px). 이 거리 이상 당기면 발동 */
const PULL_THRESHOLD = 72;
/** 당김 최대 표시 거리 (px) */
const MAX_PULL = 100;
/** 저항 계수: 손가락 이동의 이 비율만 화면이 따라옴 (낮을수록 가벼운 느낌) */
const PULL_RESISTANCE = 0.35;

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const contentHeight = fullScreen ? '100dvh' : 'calc(100dvh - 3.5rem - 4rem)';

  // Framer Motion: 당기는 거리 (손가락이 움직이면 이 값을 갱신)
  const y = useMotionValue(0);
  // 스프링으로 가볍게 복귀 (손 놓으면 빠르게 제자리로)
  const smoothY = useSpring(y, { damping: 28, stiffness: 220 });

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
        return;
      }
      const raw = delta - DRAG_START_THRESHOLD;
      const distance = Math.min(MAX_PULL, raw * PULL_RESISTANCE);
      y.set(distance);
    },
    [fullScreen, disabled, isRefreshing, y]
  );

  const onTouchEnd = useCallback(() => {
    if (fullScreen || disabled) return;
    const currentY = y.get();
    if (currentY >= PULL_THRESHOLD - 8 && !isRefreshing) {
      triggerRefresh();
    }
    y.set(0);
  }, [fullScreen, disabled, isRefreshing, y, triggerRefresh]);

  const canPull = !fullScreen && !disabled;

  return (
    <div
      ref={scrollRef}
      data-scroll-container
      className={`relative pb-safe h-full overscroll-y-none ${fullScreen || scrollDisabled ? 'no-scrollbar overflow-hidden' : 'overflow-y-auto'}`}
      style={{ height: contentHeight }}
      onTouchStart={canPull ? onTouchStart : undefined}
      onTouchMove={canPull ? onTouchMove : undefined}
      onTouchEnd={canPull ? onTouchEnd : undefined}
      onTouchCancel={canPull ? onTouchEnd : undefined}
    >
      {/* 콘텐츠 영역 (당김 시 y만 스프링으로 움직임, 아이콘 없음) */}
      <motion.div className="min-h-full" style={{ y: smoothY }}>
        {children}
      </motion.div>
    </div>
  );
}
