'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import { registerDeviceWithBackend } from '@/features/device/register-device';

const PWA_NOTIFICATION_PROMPT_SEEN_KEY = 'kookdonge-pwa-notification-prompt-seen';

function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || fullscreen || iosStandalone;
}

export function PwaNotificationPromptModal() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || !isRunningAsPWA()) return;
    try {
      if (localStorage.getItem(PWA_NOTIFICATION_PROMPT_SEEN_KEY) === 'true') return;
    } catch {
      return;
    }
    const id = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(id);
  }, [accessToken]);

  const handleAllow = async () => {
    setLoading(true);
    try {
      await registerDeviceWithBackend();
    } finally {
      setLoading(false);
    }
    try {
      localStorage.setItem(PWA_NOTIFICATION_PROMPT_SEEN_KEY, 'true');
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const handleLater = () => {
    try {
      localStorage.setItem(PWA_NOTIFICATION_PROMPT_SEEN_KEY, 'true');
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={handleLater} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-notification-title"
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800"
      >
        <h2
          id="pwa-notification-title"
          className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100"
        >
          알림을 켜시겠어요?
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          동아리 모집 시작·마감, Q&A 답변, 신청 결과 등 중요한 소식을 놓치지 않도록 알림을 허용해
          주세요.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleLater}
            className="flex-1 rounded-xl border border-zinc-200 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            나중에
          </button>
          <button
            type="button"
            onClick={handleAllow}
            disabled={loading}
            className="flex-1 rounded-xl bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-70 dark:bg-lime-400 dark:text-zinc-900 dark:hover:bg-lime-300"
          >
            {loading ? '처리 중…' : '알림 허용'}
          </button>
        </div>
      </div>
    </div>
  );
}
