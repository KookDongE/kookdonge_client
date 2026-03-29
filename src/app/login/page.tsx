'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { motion } from 'framer-motion';

import {
  getReturnUrlFromSearchParam,
  setPostLoginRedirect,
} from '@/lib/constants/auth-routes';
import { getGoogleAuthUrl, isGoogleOAuthConfigured } from '@/lib/google-oauth';
import { useAuthStore } from '@/features/auth/store';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const returnUrl = getReturnUrlFromSearchParam(searchParams.get('returnUrl'));

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  useEffect(() => {
    if (!isInitialized) return;
    if (accessToken) router.replace(returnUrl ?? '/home');
  }, [isInitialized, accessToken, router, returnUrl]);

  const handleGoogleLogin = () => {
    if (!isGoogleOAuthConfigured()) {
      alert('Google 로그인이 설정되지 않았습니다. NEXT_PUBLIC_GOOGLE_CLIENT_ID를 확인해 주세요.');
      return;
    }
    const path = returnUrl ?? '/home';
    setPostLoginRedirect(path);
    const url = getGoogleAuthUrl();
    if (url) {
      window.location.href = url;
    } else {
      alert('Google 로그인 URL을 생성할 수 없습니다.');
    }
  };

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-[var(--background)]">
      <div className="absolute top-0 left-0 z-10 flex w-full justify-start px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="뒤로가기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden
          >
            <path d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm text-center"
        >
        <h1 className="mb-4 text-3xl font-black tracking-tight text-blue-500 dark:text-lime-400">
          KookDongE
        </h1>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          국동이에서 국민대의 모든 동아리 정보를 확인해보세요!
        </p>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogleLogin}
          className="touch-btn flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-300 bg-white px-6 py-4 font-semibold text-zinc-800 transition-all hover:bg-zinc-50 disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 로그인
        </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--background)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
