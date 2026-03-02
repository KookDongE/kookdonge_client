'use client';

import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { subscribeForegroundMessage } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/store';

import { notificationKeys } from './hooks';

const DEDUPE_MS = 3000;

/**
 * 앱이 포그라운드일 때 FCM Data Message를 수신하면 알림 목록/배지 쿼리를 무효화하고
 * 토스트로 알림 내용을 보여준다. 동일 알림 중복 표시 방지.
 */
export function FcmForegroundHandler() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const lastKeyRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!accessToken) return;
    const unsubscribe = subscribeForegroundMessage((payload) => {
      const data = payload.data || {};
      const title = data.title || '알림';
      const body = data.body || data.message || '';
      const key = `${title}|${body}|${data.messageId ?? ''}`;
      const now = Date.now();
      const isDuplicate = key === lastKeyRef.current && now - lastTimeRef.current < DEDUPE_MS;
      lastKeyRef.current = key;
      lastTimeRef.current = now;

      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      if (!isDuplicate && (title || body)) {
        toast.info(body ? `${title}\n${body}` : title);
      }
    });
    return () => {
      unsubscribe?.();
    };
  }, [accessToken, queryClient]);

  return null;
}
