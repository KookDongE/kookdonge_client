'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

import { clubKeys } from '@/features/club/hooks';

/** 이 거리(px) 이상 드래그해야 인디케이터가 보이기 시작 */
const DRAG_START_THRESHOLD = 28;
/** 새로고침 발동 임계값 (px). 120px 이상 당겨야 발동 */
const PULL_THRESHOLD = 120;
/** 당김 최대 표시 거리 (px) */
const MAX_PULL = 160;
/** 저항 계수: 손가락 이동의 이 비율만 화면이 따라옴 (쫀득한 느낌) */
const PULL_RESISTANCE = 0.4;
/** 인디케이터 영역 최대 높이 (px) */
const INDICATOR_HEIGHT = 52;

/** 동아리 관리 페이지 진입 시 스크롤 리셋 */
const CLUB_MANAGE_PATH = /^\/mypage\/clubs\/[^/]+\/manage$/;

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? 'animate-spin' : ''}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

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
  // 스프링으로 부드럽게 복귀 (손 놓으면 탱글하게 제자리로)
  const smoothY = useSpring(y, { damping: 20, stiffness: 150 });

  // 당김 거리에 따른 시각적 피드백 (0 ~ 120px → 0 ~ 1)
  const pullProgress = useTransform(y, [0, PULL_THRESHOLD], [0, 1]);
  const iconRotation = useTransform(y, [0, PULL_THRESHOLD], [0, 360]);
  const iconScale = useTransform(y, [0, 100, PULL_THRESHOLD], [0.5, 1.2, 1]);

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
    if (currentY >= PULL_THRESHOLD - 10 && !isRefreshing) {
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
      {/* 상단 인디케이터 (고정 위치, 당김에 따라 회전·스케일·투명도) */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center overflow-hidden"
        style={{ height: INDICATOR_HEIGHT }}
      >
        <motion.div
          className="flex items-center justify-center rounded-full bg-white p-3 shadow-lg text-blue-500 dark:bg-zinc-800 dark:text-lime-400"
          style={{
            opacity: pullProgress,
            scale: iconScale,
            rotate: iconRotation,
          }}
        >
          <RefreshIcon spinning={isRefreshing} />
        </motion.div>
      </div>

      {/* 콘텐츠 영역 (y만 스프링으로 움직임) */}
      <motion.div
        className="min-h-full"
        style={{
          y: smoothY,
          paddingTop: INDICATOR_HEIGHT,
          marginTop: -INDICATOR_HEIGHT,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
