'use client';

import { ReactNode, useEffect } from 'react';

import { registerDeviceWithBackend } from '@/features/device/register-device';

import { AuthGuard } from './auth-guard';
import { useAuthStore } from './store';

/** 네비게이션 시 AuthProvider 재마운트되어 rehydrate()가 두 번 호출되는 것 방지 */
let hasRehydrateBeenCalled = false;

/**
 * 재수화가 끝나기 전에는 자식을 렌더링하지 않고 로딩 상태를 보여줍니다.
 * rehydrate() 완료 → onRehydrateStorage에서 setInitialized(true) 호출 후에만 children을 그립니다.
 */
function AuthLoadingFallback() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-[var(--background)]"
      aria-busy
      aria-label="로그인 상태 확인 중"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (hasRehydrateBeenCalled) return;
    hasRehydrateBeenCalled = true;
    useAuthStore.persist.rehydrate();
  }, []);

  // 재수화 후 로그인 상태면 디바이스( FCM 토큰 ) 재등록 → 푸시 알림 수신 가능
  const accessToken = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    if (!isInitialized || !accessToken) return;
    registerDeviceWithBackend().catch(() => {});
  }, [isInitialized, accessToken]);

  if (!isInitialized) {
    return <AuthLoadingFallback />;
  }

  return <AuthGuard>{children}</AuthGuard>;
}
