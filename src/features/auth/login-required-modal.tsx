'use client';

import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { buildLoginUrl } from '@/lib/constants/auth-routes';

import { useLoginRequiredModalStore } from './login-required-modal-store';

export function LoginRequiredModal() {
  const router = useRouter();
  const isOpen = useLoginRequiredModalStore((s) => s.isOpen);
  const returnUrl = useLoginRequiredModalStore((s) => s.returnUrl);
  const close = useLoginRequiredModalStore((s) => s.close);

  const goToLogin = useCallback(() => {
    const path = returnUrl ?? '/home';
    close();
    router.push(buildLoginUrl(path));
  }, [close, returnUrl, router]);

  if (typeof document === 'undefined' || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-required-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800">
        <h2
          id="login-required-title"
          className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          로그인이 필요합니다
        </h2>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          이 기능을 이용하려면 로그인해 주세요.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={close}
            className="touch-btn flex-1 rounded-xl border border-zinc-300 bg-white py-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            취소
          </button>
          <button
            type="button"
            onClick={goToLogin}
            className="touch-btn flex-1 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white dark:bg-lime-400 dark:text-zinc-900"
          >
            로그인하기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
