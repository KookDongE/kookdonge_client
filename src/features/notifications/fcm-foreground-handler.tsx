'use client';

import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { subscribeForegroundMessage } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/store';

import { notificationKeys } from './hooks';

const DEDUPE_MS = 8000;

/** 동일 알림 중복 토스트 방지: 최근 표시한 키·시간은 토스트를 띄운 뒤에만 갱신 */
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
      const key = `${title}|${body}|${data.messageId ?? ''}`.trim() || String(Date.now());
      const now = Date.now();
      const isDuplicate = key === lastKeyRef.current && now - lastTimeRef.current < DEDUPE_MS;

      queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      if (isDuplicate || !(title || body)) return;

      lastKeyRef.current = key;
      lastTimeRef.current = now;
      toast.info(body ? `${title}\n${body}` : title);
    });
    return () => {
      unsubscribe?.();
    };
  }, [accessToken, queryClient]);

  return null;
}
