'use client';

import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { notificationKeys } from './hooks';

const MIN_HIDDEN_MS = 600;
const THROTTLE_MS = 2500;

/**
 * 백그라운드 FCM은 SW만 처리되고, 같은 탭·포그라운드에서는 visibility가 안 바뀔 수 있음.
 * hidden→visible, window focus, bfcache 복원 시 서버와 맞춘다(짧은 전환·연속 이벤트는 스로틀).
 */
export function NotificationRefetchOnVisible() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hiddenAtRef = useRef<number | null>(null);
  const lastInvalidateAtRef = useRef(0);

  useEffect(() => {
    if (!accessToken) return;

    lastInvalidateAtRef.current = Date.now();

    const invalidate = () => {
      const now = Date.now();
      if (now - lastInvalidateAtRef.current < THROTTLE_MS) return;
      lastInvalidateAtRef.current = now;
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }
      if (document.visibilityState !== 'visible') return;
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt != null && Date.now() - hiddenAt < MIN_HIDDEN_MS) return;
      invalidate();
    };

    const onFocus = () => invalidate();

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) invalidate();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [accessToken, queryClient]);

  return null;
}
