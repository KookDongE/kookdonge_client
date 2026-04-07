'use client';

import { useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { notificationKeys } from './hooks';

/**
 * 백그라운드 푸시는 SW의 onBackgroundMessage에서만 처리되므로 React Query와 연결되지 않는다.
 * SW가 수신 후 같은 origin 창에 postMessage 하면 여기서 목록·미읽음 쿼리를 무효화한다.
 */
export function FcmServiceWorkerMessageBridge() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (
      !accessToken ||
      typeof navigator === 'undefined' ||
      !navigator.serviceWorker?.addEventListener
    )
      return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'FCM_PUSH_RECEIVED') return;
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [accessToken, queryClient]);

  return null;
}
