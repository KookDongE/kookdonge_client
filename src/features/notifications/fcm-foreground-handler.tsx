'use client';

import { useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { subscribeForegroundMessage } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/store';

import { notificationKeys } from './hooks';

/**
 * 앱이 포그라운드일 때 FCM Data Message를 수신하면 알림 목록/배지 쿼리를 무효화하고
 * 토스트로 알림 내용을 보여준다.
 */
export function FcmForegroundHandler() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    const unsubscribe = subscribeForegroundMessage((payload) => {
      const data = payload.data || {};
      const title = data.title || '알림';
      const body = data.body || data.message || '';
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      if (title || body) toast.info(body ? `${title}\n${body}` : title);
    });
    return () => {
      unsubscribe?.();
    };
  }, [accessToken, queryClient]);

  return null;
}
