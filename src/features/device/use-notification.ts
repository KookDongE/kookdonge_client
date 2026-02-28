'use client';

import { useCallback, useEffect, useState } from 'react';

import { getFcmToken } from '@/lib/firebase';

import { deviceApi } from './api';
import { getOrCreateDeviceId } from './device-id';

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

export type UseNotificationReturn = {
  /** 현재 알림 권한 상태 */
  permission: NotificationPermissionState;
  /** 권한 요청/토큰 발급/등록 진행 중 여부 */
  isLoading: boolean;
  /** 권한 거부 등 오류 */
  error: Error | null;
  /** 알림 권한 요청 후 FCM 토큰 발급 및 서버 디바이스 등록(갱신). 로그인 후 호출 권장. */
  requestPermissionAndRegister: () => Promise<void>;
  /** 지원 여부 (HTTPS, 서비스 워커, Firebase 설정) */
  isSupported: boolean;
};

function getPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return 'default';
}

/**
 * 브라우저 알림 권한 요청, FCM 토큰 발급, deviceId + fcmToken 서버 등록을 담당하는 훅.
 * 로그인 후 requestPermissionAndRegister()를 호출하면 푸시 알림 수신이 가능해진다.
 * 권한 거부 시 서버에는 fcmToken 'web-denied'로 등록해 푸시 발송 대상에서 제외할 수 있다.
 */
export function useNotification(): UseNotificationReturn {
  const [permission, setPermission] = useState<NotificationPermissionState>(getPermissionState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);

  const requestPermissionAndRegister = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setError(null);
    setIsLoading(true);
    try {
      const token = await getFcmToken();
      const deviceId = getOrCreateDeviceId();
      if (!deviceId) {
        setError(new Error('디바이스 ID를 생성할 수 없습니다.'));
        setIsLoading(false);
        return;
      }
      setPermission(getPermissionState());
      // 권한 거부 시에도 기기 등록은 하되, 서버에 'web-denied'로 보내 발송 스킵 유도
      await deviceApi.registerDevice({
        deviceId,
        fcmToken: token ?? 'web-denied',
        platform: 'WEB',
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      setPermission(getPermissionState());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 권한 상태 동기화 (다른 탭에서 변경 시 등)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const handler = () => setPermission(getPermissionState());
    handler();
    // Permission API는 변경 이벤트를 지원하지 않음. 주기적 체크는 생략.
  }, []);

  return {
    permission,
    isLoading,
    error,
    requestPermissionAndRegister,
    isSupported,
  };
}
