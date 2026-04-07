'use client';

import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import type { MessagePayload } from 'firebase/messaging';
import { toast } from 'sonner';

import { subscribeForegroundMessage } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/store';

import { notificationKeys } from './hooks';

const DEDUPE_MS = 8000;
const SUBSCRIBE_RETRY_MS = 700;
const SUBSCRIBE_MAX_ATTEMPTS = 6;

/** 서버는 `data`만 보내거나 FCM `notification` 블록을 쓸 수 있음. SW와 동일하게 둘 다 본다. */
function getTitleBody(payload: MessagePayload): { title: string; body: string } {
  const data = payload.data ?? {};
  const n = payload.notification;
  const title =
    (data.title && String(data.title).trim()) || (n?.title && String(n.title).trim()) || '';
  const body =
    (data.body && String(data.body).trim()) ||
    (data.message && String(data.message).trim()) ||
    (n?.body && String(n.body).trim()) ||
    '';
  return {
    title: title || '알림',
    body,
  };
}

/** 동일 알림 중복 토스트 방지: 최근 표시한 키·시간은 토스트를 띄운 뒤에만 갱신 */
export function FcmForegroundHandler() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const lastKeyRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!accessToken) return;

    const onPayload = (payload: MessagePayload) => {
      const { title, body } = getTitleBody(payload);
      const data = payload.data ?? {};
      const messageId = payload.messageId ?? data.messageId ?? '';
      const key = `${messageId}|${title}|${body}`.trim() || String(Date.now());
      const now = Date.now();
      const isDuplicate = key === lastKeyRef.current && now - lastTimeRef.current < DEDUPE_MS;

      queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      if (isDuplicate) return;

      lastKeyRef.current = key;
      lastTimeRef.current = now;
      toast.info(body ? `${title}\n${body}` : title);
    };

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    let attempt = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const trySubscribe = () => {
      if (cancelled) return;
      unsubscribe = subscribeForegroundMessage(onPayload) ?? undefined;
      if (unsubscribe) return;
      attempt += 1;
      if (attempt >= SUBSCRIBE_MAX_ATTEMPTS) return;
      timeoutId = setTimeout(trySubscribe, SUBSCRIBE_RETRY_MS);
    };

    trySubscribe();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [accessToken, queryClient]);

  return null;
}
