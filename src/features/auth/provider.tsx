'use client';

import { ReactNode, useEffect } from 'react';

import { registerDeviceWithBackend } from '@/features/device/register-device';
import { useNotification } from '@/features/device/use-notification';

import { AuthGuard } from './auth-guard';
import { LoginRequiredModal } from './login-required-modal';
import { AUTH_STORAGE_KEY, getStoredTokens, useAuthStore } from './store';

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

  /**
   * 다른 탭에서 재발급으로 refresh가 바뀌면 localStorage만 갱신되고 이 탭 메모리는 옛 토큰을 유지함.
   * 그 상태로 API → 401 → 재발급 시 무효화된 refresh로 실패 → "세션이 만료"가 반복될 수 있음(storage 이벤트로 동기화).
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== AUTH_STORAGE_KEY) return;
      if (!e.newValue) {
        if (useAuthStore.getState().accessToken) {
          useAuthStore.getState().clearAuth();
        }
        return;
      }
      try {
        const parsed = JSON.parse(e.newValue) as {
          state?: { accessToken?: string | null; refreshToken?: string | null };
        };
        const accessToken = parsed?.state?.accessToken;
        const refreshToken = parsed?.state?.refreshToken;
        if (accessToken && refreshToken) {
          useAuthStore.getState().setTokens(accessToken, refreshToken);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /**
   * 탭·앱 복귀 시 localStorage와 메모리 불일치 보정(storage 이벤트 누락·다른 탭 재발급 등).
   * PWA/WebView는 visibility보다 focus/pageshow가 먼저 오거나 누락되는 경우가 있어 함께 둔다.
   * 그렇지 않으면 메모리에 남은 옛 access로 API가 먼저 나가 401→재발급이 꼬이거나 실패해
   * `세션이 만료되었습니다` 토스트가 날 수 있음.
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncFromStorage = () => {
      const stored = getStoredTokens();
      if (!stored) return;
      const { accessToken, refreshToken } = useAuthStore.getState();
      if (stored.accessToken !== accessToken || stored.refreshToken !== refreshToken) {
        useAuthStore.getState().setTokens(stored.accessToken, stored.refreshToken);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncFromStorage();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', syncFromStorage);
    window.addEventListener('pageshow', syncFromStorage);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', syncFromStorage);
      window.removeEventListener('pageshow', syncFromStorage);
    };
  }, []);

  // 재수화 후 로그인 상태면 디바이스 등록. Firebase 지원 시 권한 요청 후 FCM 토큰 등록, 미지원 시 web-pending 등록.
  // 문서가 보일 때만 등록 시도(백그라운드에서 권한이 잘못 보고되어 web-denied로 덮어쓰는 것 방지).
  const accessToken = useAuthStore((s) => s.accessToken);
  const { requestPermissionAndRegister, isSupported } = useNotification();
  useEffect(() => {
    if (!isInitialized || !accessToken) return;
    const register = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (isSupported) requestPermissionAndRegister().catch(() => {});
      else registerDeviceWithBackend().catch(() => {});
    };
    register();
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      const onVisible = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onVisible);
          if (isSupported) requestPermissionAndRegister().catch(() => {});
          else registerDeviceWithBackend().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => document.removeEventListener('visibilitychange', onVisible);
    }
  }, [isInitialized, accessToken, isSupported, requestPermissionAndRegister]);

  if (!isInitialized) {
    return <AuthLoadingFallback />;
  }

  return (
    <>
      <AuthGuard>{children}</AuthGuard>
      <LoginRequiredModal />
    </>
  );
}
