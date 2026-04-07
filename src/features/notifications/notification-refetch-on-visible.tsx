'use client';

import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { notificationKeys } from './hooks';

const MIN_HIDDEN_MS = 600;

/**
 * 백그라운드·종료 상태의 FCM은 서비스 워커만 처리되어 `onMessage`/포그라운드 핸들러와
 * React Query 캐시가 갱신되지 않는다. 앱·탭이 다시 보일 때 목록·미읽음 수를 서버와 맞춘다.
 */
export function NotificationRefetchOnVisible() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }
      if (document.visibilityState !== 'visible') return;
      const t = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (t == null || Date.now() - t < MIN_HIDDEN_MS) return;
      invalidate();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) invalidate();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [accessToken, queryClient]);

  return null;
}
