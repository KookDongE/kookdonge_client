'use client';

import { ReactNode, useEffect } from 'react';

import { registerDeviceWithBackend } from '@/features/device/register-device';

import { AuthGuard } from './auth-guard';
import { useAuthStore } from './store';

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  // 재수화 후 로그인 상태면 디바이스( FCM 토큰 ) 재등록 → 푸시 알림 수신 가능
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  useEffect(() => {
    if (!isInitialized || !accessToken) return;
    registerDeviceWithBackend().catch(() => {});
  }, [isInitialized, accessToken]);

  return <AuthGuard>{children}</AuthGuard>;
}
