'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@heroui/react';

import { authApi } from '@/features/auth/api';
import { authKeys } from '@/features/auth/hooks';
import { useAuthStore } from '@/features/auth/store';
import { getOrCreateDeviceId } from '@/features/device/device-id';
import { deviceApi } from '@/features/device/api';
import { OAUTH_STATE_KEY } from '@/lib/google-oauth';

const WELCOME_SEEN_KEY = 'kookdonge-welcome-seen';

function registerDeviceAfterLogin() {
  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return;
  deviceApi
    .registerDevice({
      deviceId,
      fcmToken: 'web-pending',
      platform: 'WEB',
    })
    .catch(() => {});
}

export default function LoginCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorFromGoogle = searchParams.get('error');

    if (errorFromGoogle) {
      setStatus('error');
      return;
    }

    if (!code) {
      setStatus('error');
      return;
    }

    let savedState: string | null = null;
    try {
      savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
      sessionStorage.removeItem(OAUTH_STATE_KEY);
    } catch {
      // ignore
    }

    if (state !== savedState) {
      setStatus('error');
      return;
    }

    authApi
      .authenticate({ googleGrantCode: code })
      .then((res) => {
        if (res.accessToken && res.refreshToken) {
          setTokens(res.accessToken, res.refreshToken);
          queryClient.invalidateQueries({ queryKey: authKeys.profile() });
          registerDeviceAfterLogin();
        }

        if (res.newUser && res.registrationToken) {
          sessionStorage.setItem('kookdonge-registration-token', res.registrationToken);
          if (res.email) sessionStorage.setItem('kookdonge-registration-email', res.email);
          router.replace('/register');
          return;
        }

        const isFirstLogin =
          typeof window !== 'undefined' && !localStorage.getItem(WELCOME_SEEN_KEY);
        router.replace(isFirstLogin ? '/welcome' : '/home');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [searchParams, setTokens, queryClient, router]);

  if (status === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-zinc-600 dark:text-zinc-400">
          로그인에 실패했습니다.
          <br />
          다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={() => router.replace('/login')}
          className="rounded-xl bg-blue-500 px-6 py-3 font-medium text-white dark:bg-lime-400 dark:text-zinc-900"
        >
          로그인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">로그인 처리 중...</p>
    </div>
  );
}
